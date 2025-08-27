import * as cron from 'node-cron';
import { requestAirdrop } from '../utils/solana';
import { updateProbsForAllActiveMarkets } from '../utils/cronHelper';

interface CronJob {
  id: string;
  task: cron.ScheduledTask;
  schedule: string;
  description: string;
}

class CronService {
  private jobs: Map<string, CronJob> = new Map();

  constructor() {
    this.setupDefaultJobs();
  }

  private setupDefaultJobs() {
    // Example: Run every 5 seconds
    // this.addJob('heartbeat-5s', '*/5 * * * * *', () => {
    //   console.log('Running heartbeat task every 5 seconds');
    //   findAllActiveMarkets();
    // }, 'Heartbeat check every 5 seconds');

    // Example: Run every 2 minutes
    this.addJob('cleanup', '*/1 * * * *', () => {
      console.log('Running cleanup task every 1 minutes');
      updateProbsForAllActiveMarkets();
    }, 'Updating probs for all active markets');

    // Example: Run daily at midnight
    this.addJob('daily', '0 0 * * *', () => {
      console.log('Running daily task at midnight');
      requestAirdrop();
    }, 'Daily task at midnight');
  }

  addJob(id: string, schedule: string, task: () => void, description: string): void {
    if (this.jobs.has(id)) {
      console.warn(`Cron job with id '${id}' already exists. Stopping previous job.`);
      this.stopJob(id);
    }

    const scheduledTask = cron.schedule(schedule, task, {
      timezone: 'UTC'
    });

    this.jobs.set(id, {
      id,
      task: scheduledTask,
      schedule,
      description
    });

    console.log(`Added cron job: ${id} (${schedule}) - ${description}`);
  }

  removeJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (job) {
      job.task.stop();
      this.jobs.delete(id);
      console.log(`Removed cron job: ${id}`);
      return true;
    }
    return false;
  }

  stopJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (job) {
      job.task.stop();
      console.log(`Stopped cron job: ${id}`);
      return true;
    }
    return false;
  }

  startJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (job) {
      job.task.start();
      console.log(`Started cron job: ${id}`);
      return true;
    }
    return false;
  }

  startAllJobs(): void {
    this.jobs.forEach((job) => {
      job.task.start();
    });
    console.log(`Started all ${this.jobs.size} cron jobs`);
  }

  stopAllJobs(): void {
    this.jobs.forEach((job) => {
      job.task.stop();
    });
    console.log(`Stopped all ${this.jobs.size} cron jobs`);
  }

  getJobStatus(): Array<{ id: string; schedule: string; description: string; isRunning: boolean }> {
    return Array.from(this.jobs.values()).map(job => ({
      id: job.id,
      schedule: job.schedule,
      description: job.description,
      isRunning: job.task.getStatus() === 'started'
    }));
  }

  shutdown(): void {
    console.log('Shutting down cron service...');
    this.stopAllJobs();
    this.jobs.clear();
  }
}

// Create singleton instance
const cronService = new CronService();

export default cronService;