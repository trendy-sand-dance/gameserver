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
      // 34, 23 spawn location
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
  try {
    const response = await fetch(`${DATABASE_URL}/game/players`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(players)
    });
    if (!response.ok)
  {
      console.log("PUT request was not ok!");
      throw new Error("Wtf, PUT REQUEST WAS BAD");
    }
  } catch (error) {
      console.error(`sync db error`, error);
  }
}

// const timeoutId = setTimeout(() => updatePosition(5, {x: 20, y: 20}), 5000);

export async function wsGameController(client: WebSocket, request: FastifyRequest) {
  clients.add(client);
  let playerId : number = -1;

  client.on('message', async (message) => {
    const data = JSON.parse(message.toString());
    console.log("(On message) Server received: ", data);

    if (data.type === "newConnection") {
      playerId = data.id;
      // Client initializes itself in the game and sends player data to the server
      // We receive player data and add it to the players map
      players.set(data.id, { x: data.position.x, y: data.position.y });
      // We notifiy other players that a new connection has been made, other clients add new player to local map
      broadcast({ type: "newPlayer", id: data.id, username: data.username, avatar: data.avatar, position: data.position }, client);
      // console.log("Broadcasting initializePlayers", players);
      if (client.readyState == 1) {
        client.send(JSON.stringify({ type: "initializePlayers", players: Array.from(players.entries()) }));
      }
    }

    if (data.type === "move") {
      // console.log("Broadcasting move");
      broadcast(data, client);
    }
  });


  client.on('close', async (message) => {
    console.log("(On close) Server received.");
    let id = playerId;
    try {
      let pos = players.get(id);
      // const response = await fetch(`${DATABASE_URL}/game/players/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(pos)
      // });
      // if (!response.ok)
      // {
      //   console.log("PUT request was not ok!");
      //   throw new Error("Wtf, PUT REQUEST WAS BAD");
      // }
      broadcast({ type: "disconnectPlayer", id: id }, client);
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
