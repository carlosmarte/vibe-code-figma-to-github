#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PID_FILE = path.join(__dirname, '../.pids.json');
const BACKEND_PORT = process.env.BACKEND_PORT || 3200;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function killProcess(pid) {
  return new Promise((resolve) => {
    exec(`kill -TERM ${pid} 2>/dev/null`, (error) => {
      if (!error) {
        // Give it a moment to terminate gracefully
        setTimeout(() => {
          // Force kill if still running
          exec(`kill -9 ${pid} 2>/dev/null`, () => {
            resolve(true);
          });
        }, 2000);
      } else {
        resolve(false);
      }
    });
  });
}

function killPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (!error && stdout) {
        const pids = stdout.trim().split('\n');
        const killPromises = pids.map(pid => {
          return new Promise((res) => {
            exec(`kill -9 ${pid} 2>/dev/null`, () => res());
          });
        });
        Promise.all(killPromises).then(() => resolve(true));
      } else {
        resolve(false);
      }
    });
  });
}

function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -i:${port}`, (error, stdout) => {
      resolve(!error && stdout);
    });
  });
}

async function main() {
  console.clear();
  log('🛑 Figma Admin Portal - Shutdown', colors.bright + colors.yellow);
  log('=' .repeat(50), colors.yellow);

  let hasRunningProcesses = false;

  // Try to read PID file
  if (fs.existsSync(PID_FILE)) {
    log('\n📋 Reading saved process IDs...', colors.cyan);
    
    try {
      const pids = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
      
      for (const [name, pid] of Object.entries(pids)) {
        log(`   Stopping ${name} (PID: ${pid})...`, colors.yellow);
        const killed = await killProcess(pid);
        if (killed) {
          log(`   ✅ ${name} stopped`, colors.green);
          hasRunningProcesses = true;
        } else {
          log(`   ⚠️  ${name} was not running`, colors.yellow);
        }
      }

      // Remove PID file
      fs.unlinkSync(PID_FILE);
      log('\n🗑️  PID file removed', colors.green);
      
    } catch (error) {
      log(`⚠️  Error reading PID file: ${error.message}`, colors.yellow);
    }
  }

  // Also check for processes on known ports
  log('\n🔍 Checking for processes on service ports...', colors.cyan);
  
  const backendRunning = await checkPort(BACKEND_PORT);
  const frontendRunning = await checkPort(FRONTEND_PORT);

  if (backendRunning) {
    log(`   Found process on backend port ${BACKEND_PORT}`, colors.yellow);
    const killed = await killPort(BACKEND_PORT);
    if (killed) {
      log(`   ✅ Backend port cleared`, colors.green);
      hasRunningProcesses = true;
    }
  }

  if (frontendRunning) {
    log(`   Found process on frontend port ${FRONTEND_PORT}`, colors.yellow);
    const killed = await killPort(FRONTEND_PORT);
    if (killed) {
      log(`   ✅ Frontend port cleared`, colors.green);
      hasRunningProcesses = true;
    }
  }

  // Check for any other common dev server ports
  const additionalPorts = [3000, 5174, 5175];
  for (const port of additionalPorts) {
    const running = await checkPort(port);
    if (running) {
      log(`   Found process on port ${port}`, colors.yellow);
      await killPort(port);
      log(`   ✅ Port ${port} cleared`, colors.green);
      hasRunningProcesses = true;
    }
  }

  // Final summary
  log('\n' + '=' .repeat(50), colors.green);
  if (hasRunningProcesses) {
    log('✅ All services have been stopped', colors.bright + colors.green);
  } else {
    log('ℹ️  No running services found', colors.cyan);
  }
  log('=' .repeat(50), colors.green);

  process.exit(0);
}

// Run the shutdown script
main().catch(error => {
  log(`❌ Shutdown failed: ${error.message}`, colors.red);
  process.exit(1);
});