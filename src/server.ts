import Fastify, { FastifyInstance } from 'fastify';
import { routes } from './routes/routes.js';

// Plugins
import pluginCORS from '@fastify/cors';
import closeWithGrace from 'close-with-grace';

const ADDRESS: string = process.env.LISTEN_ADDRESS ? process.env.LISTEN_ADDRESS : '0.0.0.0';
const PORT: number = process.env.LISTEN_PORT ? parseInt(process.env.LISTEN_PORT, 10) : 3000;

const fastify: FastifyInstance = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true,
      }
    },
    level: 'info'
  }
});

fastify.register(pluginCORS), {
  origin: true, // Specify domains for production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

fastify.register(routes);

async function startServer() {
  // Delay is the number of milliseconds for the graceful close to finish
  closeWithGrace(
    { delay: 500 },
    async ({ err }) => {
      if (err != null) {
        fastify.log.error(err)
      }

      await fastify.close()
    }
  )

  await fastify.ready();

  try {
    await fastify.listen({ port: PORT, host: ADDRESS });
  }
  catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
