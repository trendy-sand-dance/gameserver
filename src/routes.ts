import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { addPlayer, wsGameController } from './controllers/wsGame.controller.js';

export async function routes(fastify: FastifyInstance) {
  fastify.get('/', async function(request: FastifyRequest, reply: FastifyReply) {
    reply.send({ message: 'Hi from the Fastify server', method: request.method });
  });

  // This endpoint adds the logged in player to the players map stored on this gameserver
  fastify.post('/add/:username', addPlayer);
  // fastify.delete('/add/:username' , );

  fastify.get('/ws-gameserver', { websocket: true }, wsGameController);
};
