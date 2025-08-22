import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3200', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Figma API Configuration
  FIGMA_CLIENT_ID: process.env.FIGMA_CLIENT_ID || '',
  FIGMA_CLIENT_SECRET: process.env.FIGMA_CLIENT_SECRET || '',
  FIGMA_REDIRECT_URI: process.env.FIGMA_REDIRECT_URI || 'http://localhost:3200/api/auth/callback',
  FIGMA_API_BASE_URL: 'https://api.figma.com/v1',
  
  // Database (optional - for storing user sessions/data)
  DATABASE_URL: process.env.DATABASE_URL || '',
};