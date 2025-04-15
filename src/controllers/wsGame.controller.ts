import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebSocket } from '@fastify/websocket';
const DATABASE_URL = 'http://database_container:3000';


export interface Vector2 {
  x: number;
  y: number;
}

let clients = new Set<WebSocket>();
let players = new Map<number, Vector2>();

function generateRandomPlayer(w, h) {
  return {
    id: (Math.random() * 100).toString(32).substr(3, 8),
    position: {
      x: 37,
      // y: Math.floor(Math.random() * h)
      y: 24
    }
  };
}

function broadcast(message) {
  clients.forEach((client) => {

    if (client.readyState == 1) {
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
  const randomPos = { x: Math.random() * 20, y: Math.random() * 20 }
  console.log("randomPos: ", randomPos);

  console.log("Hey, received a userpackage!!!", userPackage);

  players.set(userPackage.id, { x: randomPos.x, y: randomPos.y })


};



export async function wsGameController(client: WebSocket, request: FastifyRequest) {
  // Generate playerId and generate random spawn position
  // const player = generateRandomPlayer(32, 32);
  // console.log("New connection: ", player);
  // Add new player to gamestate object and clients Set
  // players[player.id] = player.position;
  clients.add(client);
  client.send('hi from server');

  // Initialize player and players for newly connected client
  // client.send(JSON.stringify({ type: "init", player, gameState }));
  // broadcast({
  //   type: "newPlayer",
  //   id: player.id,
  //   position: {
  //     x: player.position.x,
  //     y: player.position.y
  //   }
  // });

  client.on('message', message => {
    const data = JSON.parse(message.toString());
    console.log("(On message) Server received: ", data);

    // if (data.type === "newConnection") {
    console.log("Broadcasting initializePlayers", players);
    broadcast({ type: "initializePlayers", players: Array.from(players.entries()) });
    // }

    // if (data.type === "disconnection") {
    //   const username = data.username as string;
    //   const position: { x, y } = data.position;
    //
    //   fetch(`${DATABASE_URL}/game/players/${username}`, {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(position)
    //   });
    //
    // }

    // if (data.type == "move") {
    //   gameState.players[data.id].position = data.position;
    //   broadcast(data);
    // }
    // if (data.type == "chatMessage") {
    //   broadcast(data);
    // }
  });

  // client.on('close', message => {
  //   const data = JSON.parse(message.toString());
  //   console.log("(On close) Server received: ", data);
  //
  //   if (data.type === "disconnection") {
  //     const username = data.username as string;
  //     const position: { x, y } = data.position;
  //
  //     fetch(`${DATABASE_URL}/game/players/${username}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(position)
  //     });
  //
  //   }

  // console.log(`Client ${player.id} closed`);
  // broadcast({
  //   type: "disconnectPlayer",
  //   id: player.id
  // });
  // clients.delete(client);
  // delete gameState.players[player.id];
  // });

};
