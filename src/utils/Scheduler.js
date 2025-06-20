import cron from 'node-cron';
import { Logger } from './Logger.js';

export class Scheduler {
  constructor() {
    this.logger = new Logger('Scheduler');
    this.task = null;
    this.interval = process.env.RESEARCH_INTERVAL || 21600000; // 6 hours default
  }

  start(callback) {
    // Run every 6 hours by default
    const cronExpression = '0 */6 * * *';
    
    this.logger.info(`⏰ Starting scheduler with cron: ${cronExpression}`);
    
    this.task = cron.schedule(cronExpression, async () => {
      this.logger.info('🔄 Scheduled research cycle starting...');
      try {
        await callback();
      } catch (error) {
        this.logger.error('Scheduled task failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });
    
    this.logger.info('✅ Scheduler started successfully');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.logger.info('⏹️ Scheduler stopped');
    }
  }

  isRunning() {
    return this.task !== null;
  }
}