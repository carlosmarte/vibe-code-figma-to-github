#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKEND_PORT = process.env.BACKEND_PORT || 3200;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;
const PID_FILE = path.join(__dirname, '../.pids.json');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -i:${port}`, (error, stdout) => {
      if (error || !stdout) {
        resolve(true); // Port is free
      } else {
        resolve(false); // Port is in use
      }
    });
  });
}

function killPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, (error) => {
      setTimeout(() => resolve(), 500); // Wait a bit for the process to die
    });
  });
}

async function ensurePortAvailable(port, serviceName) {
  const isFree = await checkPort(port);
  if (!isFree) {
    log(`⚠️  Port ${port} is in use. Attempting to free it for ${serviceName}...`, colors.yellow);
    await killPort(port);
    const isNowFree = await checkPort(port);
    if (isNowFree) {
      log(`✅ Port ${port} is now available`, colors.green);
      return true;
    } else {
      log(`❌ Failed to free port ${port}`, colors.red);
      return false;
    }
  }
  return true;
}

async function startService(name, command, cwd, port) {
  log(`\n📦 Starting ${name}...`, colors.cyan);
  
  const isPortAvailable = await ensurePortAvailable(port, name);
  if (!isPortAvailable) {
    throw new Error(`Cannot start ${name}: Port ${port} is unavailable`);
  }

  return new Promise((resolve, reject) => {
    const service = spawn('npm', ['run', command], {
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' },
      shell: true
    });

    service.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Check if service is ready
      if (name === 'Backend' && output.includes('Server listening')) {
        log(`✅ ${name} is running on port ${port}`, colors.green);
        resolve(service);
      } else if (name === 'Frontend' && output.includes('ready in')) {
        log(`✅ ${name} is running on port ${port}`, colors.green);
        resolve(service);
      }
      
      // Print service output with prefix
      output.split('\n').filter(line => line.trim()).forEach(line => {
        console.log(`${colors.bright}[${name}]${colors.reset} ${line}`);
      });
    });

    service.stderr.on('data', (data) => {
      const output = data.toString();
      output.split('\n').filter(line => line.trim()).forEach(line => {
        console.error(`${colors.red}[${name} Error]${colors.reset} ${line}`);
      });
    });

    service.on('error', (error) => {
      log(`❌ Failed to start ${name}: ${error.message}`, colors.red);
      reject(error);
    });

    service.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log(`⚠️  ${name} exited with code ${code}`, colors.yellow);
      }
    });

    // Set a timeout for service startup
    setTimeout(() => {
      if (service.exitCode === null) {
        // Service is still running but didn't signal ready
        log(`⚠️  ${name} started but readiness check timed out`, colors.yellow);
        resolve(service);
      }
    }, 10000);
  });
}

async function savePids(processes) {
  const pids = {};
  for (const [name, process] of Object.entries(processes)) {
    if (process && process.pid) {
      pids[name] = process.pid;
    }
  }
  fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
  log(`\n💾 Process IDs saved to ${PID_FILE}`, colors.blue);
}

async function cleanupExistingProcesses() {
  log('\n🧹 Cleaning up existing processes...', colors.yellow);
  
  // Check for PID file and kill those processes
  if (fs.existsSync(PID_FILE)) {
    try {
      const pids = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
      for (const [name, pid] of Object.entries(pids)) {
        exec(`kill -9 ${pid} 2>/dev/null`, () => {});
      }
      fs.unlinkSync(PID_FILE);
      log('   ✅ Cleaned up tracked processes', colors.green);
    } catch (error) {
      // Ignore errors, file might be corrupted
    }
  }

  // Force kill any processes on our ports
  const ports = [BACKEND_PORT, FRONTEND_PORT, 3000, 5174, 5175];
  for (const port of ports) {
    await killPort(port);
  }
  
  // Wait a moment for processes to fully terminate
  await new Promise(resolve => setTimeout(resolve, 1000));
  log('   ✅ All ports cleared', colors.green);
}

async function main() {
  console.clear();
  log('🚀 Figma Admin Portal - Starting Services', colors.bright + colors.cyan);
  log('=' .repeat(50), colors.cyan);

  // Always cleanup first
  await cleanupExistingProcesses();

  const processes = {};

  try {
    // Check if dependencies are installed
    const backendNodeModules = path.join(__dirname, '../backend/node_modules');
    const frontendNodeModules = path.join(__dirname, '../frontend/node_modules');
    
    if (!fs.existsSync(backendNodeModules) || !fs.existsSync(frontendNodeModules)) {
      log('\n📦 Installing dependencies...', colors.yellow);
      await new Promise((resolve, reject) => {
        const install = spawn('npm', ['run', 'install:all'], {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit',
          shell: true
        });
        install.on('exit', (code) => {
          if (code === 0) resolve();
          else reject(new Error('Failed to install dependencies'));
        });
      });
    }

    // Start Backend
    processes.backend = await startService(
      'Backend',
      'dev',
      path.join(__dirname, '../backend'),
      BACKEND_PORT
    );

    // Wait a bit before starting frontend to ensure backend is ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start Frontend
    processes.frontend = await startService(
      'Frontend',
      'dev',
      path.join(__dirname, '../frontend'),
      FRONTEND_PORT
    );

    // Save process IDs
    await savePids(processes);

    log('\n' + '=' .repeat(50), colors.green);
    log('✨ All services are running!', colors.bright + colors.green);
    log('\n📋 Service URLs:', colors.cyan);
    log(`   Frontend:    http://localhost:${FRONTEND_PORT}`, colors.blue);
    log(`   Backend API: http://localhost:${BACKEND_PORT}`, colors.blue);
    log(`   API Docs:    http://localhost:${BACKEND_PORT}/documentation`, colors.blue);
    log('\n💡 Press Ctrl+C to stop all services', colors.yellow);
    log('=' .repeat(50), colors.green);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      log('\n\n🛑 Shutting down services...', colors.yellow);
      
      for (const [name, proc] of Object.entries(processes)) {
        if (proc && !proc.killed) {
          log(`   Stopping ${name}...`, colors.yellow);
          proc.kill('SIGTERM');
        }
      }

      // Clean up PID file
      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }

      log('👋 Goodbye!', colors.green);
      process.exit(0);
    });

    // Keep the script running
    process.stdin.resume();

  } catch (error) {
    log(`\n❌ Startup failed: ${error.message}`, colors.red);
    
    // Clean up any started processes
    for (const proc of Object.values(processes)) {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
      }
    }
    
    process.exit(1);
  }
}

// Run the startup script
main().catch(console.error);