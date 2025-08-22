import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface ProcessInfo {
  pid: number;
  port: number;
  startTime: number;
  type: 'backend' | 'frontend';
}

export class ProcessManager {
  private static instance: ProcessManager;
  private lockFile: string;
  private processFile: string;
  
  private constructor() {
    const projectRoot = path.resolve(__dirname, '../../../');
    this.lockFile = path.join(projectRoot, '.server.lock');
    this.processFile = path.join(projectRoot, '.running-processes.json');
  }
  
  static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }
  
  async acquireLock(port: number, type: 'backend' | 'frontend'): Promise<boolean> {
    try {
      // Check if another instance is already running on this port
      const processes = await this.getRunningProcesses();
      const existing = processes.find(p => p.port === port && p.type === type);
      
      if (existing) {
        // Check if the process is actually running
        const isRunning = await this.isProcessRunning(existing.pid);
        
        if (isRunning) {
          console.log(`⚠️  Another ${type} instance is already running on port ${port} (PID: ${existing.pid})`);
          return false;
        } else {
          // Process died but wasn't cleaned up
          await this.removeProcess(existing.pid);
        }
      }
      
      // Register this process
      const info: ProcessInfo = {
        pid: process.pid,
        port,
        startTime: Date.now(),
        type
      };
      
      await this.addProcess(info);
      
      // Setup cleanup on exit
      this.setupCleanup(process.pid);
      
      return true;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return true; // Allow startup even if lock fails
    }
  }
  
  async releaseLock(pid: number = process.pid): Promise<void> {
    try {
      await this.removeProcess(pid);
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }
  
  private async getRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      if (fs.existsSync(this.processFile)) {
        const data = fs.readFileSync(this.processFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading process file:', error);
    }
    return [];
  }
  
  private async saveRunningProcesses(processes: ProcessInfo[]): Promise<void> {
    try {
      fs.writeFileSync(this.processFile, JSON.stringify(processes, null, 2));
    } catch (error) {
      console.error('Error saving process file:', error);
    }
  }
  
  private async addProcess(info: ProcessInfo): Promise<void> {
    const processes = await this.getRunningProcesses();
    processes.push(info);
    await this.saveRunningProcesses(processes);
  }
  
  private async removeProcess(pid: number): Promise<void> {
    const processes = await this.getRunningProcesses();
    const filtered = processes.filter(p => p.pid !== pid);
    await this.saveRunningProcesses(filtered);
  }
  
  private async isProcessRunning(pid: number): Promise<boolean> {
    try {
      await execAsync(`ps -p ${pid}`);
      return true;
    } catch {
      return false;
    }
  }
  
  private setupCleanup(pid: number): void {
    const cleanup = async () => {
      await this.releaseLock(pid);
    };
    
    // Clean up on various exit signals
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGHUP', cleanup);
    process.on('uncaughtException', async (err) => {
      console.error('Uncaught exception:', err);
      await cleanup();
      process.exit(1);
    });
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled rejection:', reason);
      await cleanup();
      process.exit(1);
    });
  }
  
  async cleanupStaleProcesses(): Promise<void> {
    try {
      const processes = await this.getRunningProcesses();
      const alive: ProcessInfo[] = [];
      
      for (const proc of processes) {
        if (await this.isProcessRunning(proc.pid)) {
          alive.push(proc);
        } else {
          console.log(`🧹 Cleaning up stale process entry (PID: ${proc.pid})`);
        }
      }
      
      await this.saveRunningProcesses(alive);
    } catch (error) {
      console.error('Error cleaning up stale processes:', error);
    }
  }
  
  async killAllOnPort(port: number): Promise<void> {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      if (stdout) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            console.log(`✅ Killed process ${pid} on port ${port}`);
          } catch {
            // Process might have already died
          }
        }
      }
    } catch {
      // No processes on this port
    }
  }
}