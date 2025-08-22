import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FigmaAuthService } from '../services/figma-auth.service';
import { config } from '../config';

interface CallbackQuery {
  code?: string;
  state?: string;
  error?: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  const authService = new FigmaAuthService();

  fastify.get('/figma', async (request: FastifyRequest, reply: FastifyReply) => {
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://www.figma.com/oauth?` +
      `client_id=${config.FIGMA_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(config.FIGMA_REDIRECT_URI)}&` +
      `scope=file_read&` +
      `state=${state}&` +
      `response_type=code`;

    reply.setCookie('oauth_state', state, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    return reply.redirect(authUrl);
  });

  fastify.get('/callback', async (request: FastifyRequest<{ Querystring: CallbackQuery }>, reply: FastifyReply) => {
    const { code, state, error } = request.query;

    if (error) {
      return reply.redirect(`${config.FRONTEND_URL}/login?error=${error}`);
    }

    const storedState = request.cookies.oauth_state;
    if (!state || state !== storedState) {
      return reply.code(400).send({ error: 'Invalid state parameter' });
    }

    if (!code) {
      return reply.code(400).send({ error: 'Missing authorization code' });
    }

    try {
      const tokenData = await authService.exchangeCodeForToken(code);
      const token = fastify.jwt.sign({ 
        accessToken: tokenData.access_token,
        userId: tokenData.user_id,
      });

      reply.setCookie('token', token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 * 7, // 7 days
      });

      return reply.redirect(`${config.FRONTEND_URL}/dashboard`);
    } catch (error) {
      fastify.log.error(error);
      return reply.redirect(`${config.FRONTEND_URL}/login?error=auth_failed`);
    }
  });

  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('token');
    return { success: true };
  });

  fastify.get('/verify', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return { 
      authenticated: true, 
      user: request.user 
    };
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
  interface FastifyRequest {
    user?: any;
  }
}