const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    
    // Only instantiate bot if token is provided
    if (this.token && this.token !== 'your_bot_token_here') {
      this.bot = new TelegramBot(this.token, { polling: false });
    } else {
      this.bot = null;
      logger.warn('TELEGRAM_BOT_TOKEN is not set or invalid. Telegram notifications are disabled.');
    }
  }

  async sendLateEntryAlert(studentId, entryTime, reason) {
    if (!this.bot || !this.chatId || this.chatId === 'your_chat_id_here') {
      logger.info(`Mock Telegram Alert (Bot Disabled) - Late Entry: ${studentId} at ${entryTime} for reason: ${reason}`);
      return;
    }

    const message = `🚨 *LATE ENTRY ALERT* 🚨\nStudent ID: ${studentId}\nTime: ${entryTime}\nReason: ${reason || 'Not provided'}`;

    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
      logger.info(`Successfully sent Telegram late entry alert for student ${studentId}`);
    } catch (error) {
      logger.error('Failed to send Telegram alert:', error.message);
    }
  }
}

module.exports = new TelegramService();
