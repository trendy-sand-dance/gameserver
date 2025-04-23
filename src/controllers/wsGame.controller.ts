import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebSocket } from '@fastify/websocket';
const DATABASE_URL = 'http://database_container:3000';

let clients = new Set<WebSocket>();
let players = new Map<number, Vector2>();

export interface Vector2 {
  x: number;
  y: number;
}

function broadcast(message, currentClient) {
  clients.forEach((client) => {

    if (client.readyState == 1 && client !== currentClient) {
      client.send(JSON.stringify(message));
    }
  });
}

interface Player {
  id: number,
  username: string,
  avatar: string,
  x: number,
  y: number,
}

export async function addPlayer(request: FastifyRequest, reply: FastifyReply) {

  const { username } = request.params as { username: string };
  const userPackage = request.body as Player;

  if (!players.get(userPackage.id)) {
    if (userPackage.x === 0 && userPackage.y === 0) {
      players.set(userPackage.id, { x: 36, y: 23 })
    } else {
      players.set(userPackage.id, { x: userPackage.x, y: userPackage.y })
    }
  }


};

export async function removePlayer(request: FastifyRequest, reply: FastifyReply) {

  const { id } = request.params as { id: number };

  if (!players.get(id)) {

    console.log("Attempting to delete player that doesn't exist in-memory");
  }
  players.delete(id);
};


async function syncPlayersDB() {
  console.log("Syncing players...", players);
  if (!players || players.size === 0)
  {
    console.log("Nothing to sync, no players...");
    setTimeout(syncPlayersDB, 5000);
    return;
  }

  try {

    //TODO: sync players in a batch.
    // const response = await fetch(`${DATABASE_URL}/game/players`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(players)
    // });
    // if (!response.ok)
    // {
    //   throw {code: 500, message: "Failed to upate user"};
    // }

    for (const [id, position] of players) 
    {
      const response = await fetch(`${DATABASE_URL}/game/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(position)
      });
      if (!response.ok)
      {
        throw {code: 500, message: "Failed to upate user"};
      }
    }
    console.log("Succesfully synced players!");
  } catch (error)
  {
      console.error(`sync db error`, error);
  }
  setTimeout(syncPlayersDB, 10000);
}

syncPlayersDB();

export async function wsGameController(client: WebSocket, request: FastifyRequest) {


  clients.add(client);
  let playerId : number = -1;

  client.on('message', async (message) => {
    const data = JSON.parse(message.toString());

    if (data.type === "newConnection") {
      console.log("(On message) Server received: ", data);
      playerId = data.id;
      players.set(data.id, { x: data.position.x, y: data.position.y });
      broadcast({ type: "newPlayer", id: data.id, username: data.username, avatar: data.avatar, position: data.position }, client);
      if (client.readyState == 1) {
        client.send(JSON.stringify({ type: "initializePlayers", players: Array.from(players.entries()) }));
      }
    }

    if (data.type === "move") {
      players.set(data.id, {x: data.position.x, y: data.position.y});
      broadcast(data, client);
    }
  });


  client.on('close', async (message) => {
    console.log("(On close) Server received.");
    let id = playerId;
    try {
      let pos = players.get(id);
      broadcast({ type: "disconnectPlayer", id: id }, client);
      const response = await fetch(`${DATABASE_URL}/game/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pos)
      });
      if (!response.ok)
      {
        throw {code: 500, message: "Failed to upate user"};
      }
      console.log("Succesfully synced players!");
      console.log(`Disconnecting ${id} from server`);
      clients.delete(client);
      players.delete(id);
    } catch (error) {
      console.error(`disconnection error, attempting to delete ${id} from server anyways`, error);
      clients.delete(client);
      players.delete(id);
    }

  });
};
