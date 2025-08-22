import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  });
}