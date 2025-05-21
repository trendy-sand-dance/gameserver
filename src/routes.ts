import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getTournamentPlayers, wsGameController } from './controllers/wsGame.controller.js';

export async function routes(fastify: FastifyInstance) {
  fastify.get('/', async function(request: FastifyRequest, reply: FastifyReply) {
    reply.send({ message: 'Hi from the Fastify server', method: request.method });
  });

  fastify.get('/ws-gameserver', { websocket: true }, wsGameController);
  fastify.get('/getTournamentPlayers', getTournamentPlayers);
};
