import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function routes(fastify: FastifyInstance) {
  fastify.get('/', async function(request: FastifyRequest, reply: FastifyReply) {
    reply.send({ message: 'Hi from the Fastify server', method: request.method });
  });
};
