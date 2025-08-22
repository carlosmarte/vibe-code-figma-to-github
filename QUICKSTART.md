# 🚀 Figma Admin Portal - Quick Start Guide

## ✅ Prerequisites
- Node.js 18+ and npm 9+ installed
- Figma account for OAuth setup

## 🎯 Quick Setup (3 steps)

### 1️⃣ Install Dependencies
```bash
npm run install:all
```

### 2️⃣ Configure Environment
```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env and add your Figma OAuth credentials

# Frontend configuration (optional)
cp frontend/.env.example frontend/.env
```

### 3️⃣ Start the Application
```bash
npm run start
```

## 📊 Service Management Commands

| Command | Description |
|---------|------------|
| `npm run start` | 🚀 Start all services with automatic port management |
| `npm run stop` | 🛑 Gracefully shutdown all services |
| `npm run restart` | 🔄 Restart all services |
| `npm run status` | 📊 Check service status and health |

## 🌐 Access Points

Once running, access the application at:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3200
- **API Documentation**: http://localhost:3200/documentation

## 🔧 Troubleshooting

### Port Already in Use?
```bash
npm run clean:ports  # Force kill processes on service ports
npm run start        # Start fresh
```

### Services Not Responding?
```bash
npm run status       # Check what's running
npm run restart      # Full restart
```

### Need a Clean Slate?
```bash
npm run stop         # Stop everything
npm run clean        # Remove all dependencies and builds
npm run install:all  # Reinstall everything
npm run start        # Start fresh
```

## 🔐 Figma OAuth Setup

1. Go to [Figma Developers](https://www.figma.com/developers)
2. Create a new OAuth app
3. Set redirect URI to: `http://localhost:3200/api/auth/callback`
4. Copy Client ID and Secret to `backend/.env`

## 📝 Features Available

- ✅ OAuth Authentication with Figma
- ✅ File browsing and management
- ✅ Import Figma files by URL/key
- ✅ Export in multiple formats (JSON, SVG, PNG, PDF)
- ✅ Dashboard with statistics
- ✅ User settings and preferences

## 💡 Development Tips

- The startup script automatically handles port conflicts
- Process IDs are tracked in `.pids.json` (gitignored)
- Both services run with hot-reload in development
- Check `npm run status` to monitor service health

## 🆘 Need Help?

- Check the full README.md for detailed documentation
- View API docs at http://localhost:3200/documentation
- Review logs in the terminal where services are running

---

**Ready to go!** Run `npm run start` and visit http://localhost:5173 🎉