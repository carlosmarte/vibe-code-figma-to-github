import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.cookies.token || request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const decoded = fastify.jwt.verify(token);
      request.user = decoded;
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
  });
}

export default fp(authPlugin);