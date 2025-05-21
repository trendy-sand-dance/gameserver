import { FastifyRequest, FastifyReply } from 'fastify';
import { WebSocket } from '@fastify/websocket';
import PongGame from '../pong/ponggame.js';
import Tournament from '../pong/tournament.js';
const DATABASE_URL = 'http://database_container:3000';
import { TournamentState } from '../types.js';


let clients = new Set<WebSocket>();
let players = new Map<number, Player>();
const pongGame = new PongGame(1, 4, 2, false); // id, w, h (Horizontal (4x2))
const pongGameTournament = new PongGame(2, 4, 2, true);
const pongTournament = new Tournament();

export function broadcast(message, currentClient: WebSocket | null) {
  clients.forEach((client) => {

    if (client.readyState == 1 && client !== currentClient) {
      client.send(JSON.stringify(message));
    }
  });
}

async function syncPlayersDB() {
  if (!players || players.size === 0) {
    // console.log("Nothing to sync, no players...");
    setTimeout(syncPlayersDB, 5000);
    return;
  }

  try {

    // console.log("Syncing players...", players);

    //TODO: sync players in a batch.
    for (const [id, player] of players) {
      const response = await fetch(`${DATABASE_URL}/game/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: { x: player.x, y: player.y } })
      });
      if (!response.ok) {
        throw { code: 500, message: "Failed to upate user" };
      }
    }
    // console.log("Succesfully synced players!");
  } catch (error) {
    // console.error(`sync db error`, error);
  }
  setTimeout(syncPlayersDB, 15000);
}

syncPlayersDB();


export async function getTournamentPlayers(request: FastifyRequest, reply: FastifyReply) {

  const pongPlayers: TournamentPlayer[] = pongTournament.getPlayers();

  return reply.code(200).send({ pongPlayers });
}

export async function wsGameController(client: WebSocket, request: FastifyRequest) {


  clients.add(client);
  let playerId: number = -1;
  let currentPlayer: Player | null = null;


  client.on('message', async (message) => {
    const data = JSON.parse(message.toString());

    // Player management
    if (data.type === "new_connection") {
      // console.log("(On message) Server received: ", data);
      currentPlayer = { id: data.id, username: data.username, avatar: data.avatar, x: data.position.x, y: data.position.y };

      playerId = data.id;
      players.set(data.id, currentPlayer);
      broadcast({ type: "new_player", id: data.id, username: data.username, avatar: data.avatar, position: data.position }, client);
      if (client.readyState == 1) {
        client.send(JSON.stringify({ type: "initialize_players", players: Array.from(players.entries()) }));
        if (pongGame.isInProgress()) {
          client.send(JSON.stringify({ type: "current_pong_state", pongState: pongGame.getPongState() }));
        }
        else {

          const pl = pongGame.getPlayer('left');
          const pr = pongGame.getPlayer('right');

          if (pl)
            client.send(JSON.stringify({ type: "initialize_pong", left: pl, right: null }));
          else if (pr)
            client.send(JSON.stringify({ type: "initialize_pong", left: null, right: pr }));

          console.log("initialize_pong, ", pongGame.getPlayer('left'), pongGame.getPlayer('right'));
        }
      }
    }

    if (data.type === "player_move") {
      // console.log("(On message) Server received: ", data);
      const player = players.get(data.id);
      if (player) {
        player.x = data.position.x;
        player.y = data.position.y;
      }
      broadcast(data, client);
    }

    // Pong Game

    if (data.type === "join_pong") {
      console.log("(On message) Server received: ", data);
      const pongPlayer = pongGame.assignPlayer(data.pongPlayer, client);

      if (pongPlayer) {
        client.send(JSON.stringify({ type: "confirm_pong_player", pongPlayer }));
        broadcast({ type: "player_joined_pong", pongPlayer }, client);
        if (pongGame.playersAreReady()) {
          pongGame.countdownTimer();
        }
      }
      else {
        console.log("assigning player to table failed!");
      }
    }

    if (data.type === "leave_pong") {
      console.log("(On message) Server received: ", data);
      const pongPlayer: PongPlayer = data.pongPlayer;
      pongGame.stopGame();
      // pongGame.removePlayer(pongPlayer);
      broadcast({ type: "leave_pong", pongPlayer }, null);
    }

    if (data.type === "paddle_move") {
      // console.log("(On message) Server received: ", data);
      if (data.tournament) {
        pongGameTournament.handlePaddle(data.side, data.direction);
        broadcast({ type: "pong_update_tournament", pongState: pongGameTournament.getPaddleState() }, null);
      }
      else {
        pongGame.handlePaddle(data.side, data.direction);
        broadcast({ type: "pong_update", pongState: pongGame.getPaddleState() }, null);
      }
    }

    // Tournament stuff
    // Subscribtion pole
    if (data.type == "tournament_join") {
      console.log("(On message) Server received: ", data);
      const tournamentPlayer: TournamentPlayer = data.tournamentPlayer;
      if (tournamentPlayer) {
        pongTournament.subscribe(tournamentPlayer);
        if (pongTournament.isTournamentFull()) {
          pongTournament.transitionTo(TournamentState.Scheduling);
        }
      }
    }

    if (data.type == "tournament_leave") {
      console.log("(On message) Server received: ", data);
      const tournamentPlayer: TournamentPlayer = data.tournamentPlayer;
      if (tournamentPlayer) {
        pongTournament.unsubscribe(tournamentPlayer);
      }
    }


    // Player attempts to ready up tournament side
    if (data.type === "join_pong_tournament") {
      console.log("(On message) Server received: ", data);
      const pongPlayer = pongGameTournament.assignPlayer(data.pongPlayer, client);

      if (pongPlayer) {
        client.send(JSON.stringify({ type: "confirm_pong_player_tournament", pongPlayer }));
        broadcast({ type: "player_joined_pong_tournament", pongPlayer }, client);
        if (pongGameTournament.playersAreReady()) {
          pongGameTournament.countdownTournamentTimer(pongTournament);
        }
      }
      else {
        console.log("assigning player to table failed!");
      }
    }

    if (data.type === "leave_pong_tournament") {
      console.log("(On message) Server received: ", data);
      const pongPlayer: PongPlayer = data.pongPlayer;
      pongGameTournament.removePlayer(pongPlayer);
      broadcast({ type: "leave_pong_tournament", pongPlayer }, null);
    }

  });


  client.on('close', async (message) => {
    console.log("(On close) Server received.");
    let id = playerId;
    try {
      let pos = players.get(id);
      broadcast({ type: "disconnect_player", id: id }, client);
      const response = await fetch(`${DATABASE_URL}/game/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pos)
      });
      if (!response.ok) {
        throw { code: 500, message: "Failed to upate user" };
      }
      console.log("Succesfully synced players!");
      console.log(`Disconnecting ${id} from server`);
      clients.delete(client);
      players.delete(id);
      if (pongGame.isInProgress()) {
        pongGame.stopGame()
        broadcast({ type: "player_disconnected_pong" }, null);
      }
    } catch (error) {
      console.error(`disconnection error, attempting to delete ${id} from server anyways`, error);
      clients.delete(client);
      players.delete(id);
    }

  });

};
