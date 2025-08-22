import axios from 'axios';
import { config } from '../config';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user_id: string;
}

export class FigmaAuthService {
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post('https://www.figma.com/api/oauth/token', {
        client_id: config.FIGMA_CLIENT_ID,
        client_secret: config.FIGMA_CLIENT_SECRET,
        redirect_uri: config.FIGMA_REDIRECT_URI,
        code,
        grant_type: 'authorization_code',
      });

      return response.data;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange code for token');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await axios.post('https://www.figma.com/api/oauth/refresh', {
        client_id: config.FIGMA_CLIENT_ID,
        client_secret: config.FIGMA_CLIENT_SECRET,
        refresh_token: refreshToken,
      });

      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
  }
}