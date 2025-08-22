# Figma Admin Portal

A full-stack web application for managing Figma files with import/export capabilities, built with Fastify, React, and TypeScript.

## Features

- 🔐 Figma OAuth authentication
- 📁 Browse and manage Figma files
- 📥 Import Figma files to the portal
- 📤 Export files in multiple formats (JSON, SVG, PNG, PDF)
- 📊 Dashboard with file statistics
- 🔍 Search and filter capabilities
- ⚙️ Configurable settings

## Tech Stack

### Backend
- **Fastify** - Fast and efficient Node.js web framework
- **TypeScript** - Type-safe development
- **JWT** - Secure authentication
- **Swagger** - API documentation

### Frontend
- **React** - UI library
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## Prerequisites

- Node.js 18+ 
- npm 9+
- Figma account and API credentials

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/figma-admin-portal.git
cd figma-admin-portal
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Configure environment variables

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Figma API credentials:
- `FIGMA_CLIENT_ID` - Your Figma OAuth app client ID
- `FIGMA_CLIENT_SECRET` - Your Figma OAuth app client secret
- `JWT_SECRET` - A secure random string for JWT signing

#### Frontend (.env)
```bash
cd ../frontend
cp .env.example .env
```

### 4. Run the development servers
```bash
# From the root directory
npm run dev
```

This will start:
- Backend server at http://localhost:3200
- Frontend dev server at http://localhost:5173
- API documentation at http://localhost:3200/documentation

## Project Structure

```
figma-admin-portal/
├── backend/           # Fastify API server
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── services/  # Business logic and Figma API integration
│   │   ├── plugins/   # Fastify plugins
│   │   └── types/     # TypeScript type definitions
├── frontend/          # React application
│   ├── src/
│   │   ├── pages/     # Route page components
│   │   ├── components/# Reusable UI components
│   │   ├── layouts/   # Layout components
│   │   ├── services/  # API client services
│   │   ├── contexts/  # React contexts
│   │   └── hooks/     # Custom React hooks
└── shared/            # Shared types between frontend and backend
    └── types/
```

## Available Scripts

### Process Management (Recommended)
- `npm run start` - 🚀 Start all services with automatic port management
- `npm run stop` - 🛑 Gracefully shutdown all running services
- `npm run restart` - 🔄 Restart all services
- `npm run status` - 📊 Check the status of all services
- `npm run clean:ports` - 🧹 Force kill processes on service ports

### Development
- `npm run dev` - Start both backend and frontend in development mode (basic)
- `npm run build` - Build both backend and frontend for production
- `npm run install:all` - Install dependencies for all workspaces
- `npm run clean` - Remove all node_modules and build artifacts

### Backend Specific
- `npm run dev:backend` - Start backend development server
- `npm run build:backend` - Compile TypeScript to JavaScript
- `npm run serve` - Start backend production server
- `npm run lint:backend` - Run ESLint on backend
- `npm run type-check:backend` - Check backend TypeScript types

### Frontend Specific
- `npm run dev:frontend` - Start frontend Vite dev server
- `npm run build:frontend` - Build frontend for production
- `npm run lint:frontend` - Run ESLint on frontend
- `npm run type-check:frontend` - Check frontend TypeScript types

## Figma OAuth Setup

1. Go to [Figma Developers](https://www.figma.com/developers)
2. Create a new OAuth app
3. Set the redirect URI to `http://localhost:3200/api/auth/callback`
4. Copy the Client ID and Client Secret to your backend `.env` file

## API Documentation

Once the backend is running, visit http://localhost:3200/documentation to view the interactive Swagger API documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT