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
  console.log("Hey, received a userpackage!!!", userPackage);

  if (!players.get(userPackage.id)) {
    if (userPackage.x === 0 && userPackage.y === 0) {
      const randomPos = { x: 2 + (Math.random() * 8), y: 2 + (Math.random() * 8) }
      console.log("randomPos: ", randomPos);
      players.set(userPackage.id, { x: randomPos.x, y: randomPos.y })
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



export async function wsGameController(client: WebSocket, request: FastifyRequest) {
  clients.add(client);

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

  client.on('message', async (message) => {
    const data = JSON.parse(message.toString());
    console.log("(On message) Server received: ", data);

    if (data.type === "newConnection") {
      console.log("Broadcasting initializePlayers", players);
      broadcast({ type: "initializePlayers", players: Array.from(players.entries()) });
    }

    if (data.type === "move") {
      console.log("Broadcasting move");
      broadcast(data);
    }

    if (data.type === "disconnection") {
      const id = data.id as number;
      const position = data.position as Vector2;

      try {
        await fetch(`${DATABASE_URL}/game/players/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(position)
        });
        broadcast({ type: "disconnectPlayer", id: id });
        players.delete(id);
      } catch (error) {
        console.error(`disconnection error, attempting to delete ${id} from server anyways`, error);
        players.delete(id);
      }

    }



    // if (data.type == "move") {
    //   gameState.players[data.id].position = data.position;
    //   broadcast(data);
    // }
    // if (data.type == "chatMessage") {
    //   broadcast(data);
    // }
  });

  // client.on('close', async (message) => {
  //   const data = JSON.parse(message.toString());
  //   console.log("(On close) Server received: ", data);
  //
  //   if (data.type === "disconnection") {
  //     const id = data.id as number;
  //     const position = data.position as Vector2;
  //
  //     await fetch(`${DATABASE_URL}/game/players/${id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(position)
  //     });
  //
  //   }
  // });

  // console.log(`Client ${player.id} closed`);
  // broadcast({
  //   type: "disconnectPlayer",
  //   id: player.id
  // });
  // clients.delete(client);
  // delete gameState.players[player.id];
  // });

};
