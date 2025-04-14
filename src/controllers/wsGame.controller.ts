import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebSocket } from '@fastify/websocket';


let clients = new Set<WebSocket>();

let gameState = {
  players: {},
}

function generateRandomPlayer(w, h) {
  return {
    id: (Math.random() * 100).toString(32).substr(3, 8),
    position: {
      x: Math.floor(Math.random() * w),
      // y: Math.floor(Math.random() * h)
      y: 2
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

export async function wsGameController(client: WebSocket, request: FastifyRequest) {
  // Generate playerId and generate random spawn position
  const player = generateRandomPlayer(32, 32);
  console.log("New connection: ", player);
  // Add new player to gamestate object and clients Set
  // gameState.players[player.id] = player.position;
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

    console.log("Server received: ", data);

    // if (data.type == "move") {
    //   gameState.players[data.id].position = data.position;
    //   broadcast(data);
    // }
    // if (data.type == "chatMessage") {
    //   broadcast(data);
    // }
  });

  // client.on('close', message => {
  //   console.log(`Client ${player.id} closed`);
  //
  //   broadcast({
  //     type: "disconnectPlayer",
  //     id: player.id
  //   });
  //
  //   clients.delete(client);
  //   delete gameState.players[player.id];
  // });

};
