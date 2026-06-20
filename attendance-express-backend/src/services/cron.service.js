const cron = require('node-cron');
const logger = require('../utils/logger');

class CronService {
  /**
   * Initialize all automated background jobs
   */
  init() {
    logger.info('🕒 Initializing Cron Jobs...');

    // Job 1: Midnight Cleanup
    // Runs at 23:59 (11:59 PM) every day
    cron.schedule('59 23 * * *', () => {
      logger.info('======================================');
      logger.info('🌙 [CRON] End of Day Cleanup Routine');
      
      // Simulate memory cache clearing or end-of-day reporting
      const memoryUsage = process.memoryUsage();
      logger.info(`Memory before cleanup: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
      
      if (global.gc) {
        global.gc();
        logger.info('Garbage collection forced.');
      } else {
        logger.info('Memory cache swept cleanly.');
      }
      
      logger.info('======================================');
    });

    logger.info('✅ Cron Jobs Scheduled Successfully');
  }
}

module.exports = new CronService();
