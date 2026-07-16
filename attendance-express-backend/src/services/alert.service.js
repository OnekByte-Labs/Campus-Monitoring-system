const socketService = require('./socket.service');
const telegramService = require('./telegram.service');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class AlertService {
  getSettings() {
    const configPath = path.join(__dirname, '../../config.json');
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (e) {
      logger.error('Error reading config.json', e);
    }
    return { LATE_HOUR_START: 9, LATE_HOUR_END: 15 };
  }

  saveSettings(newSettings) {
    const configPath = path.join(__dirname, '../../config.json');
    try {
      const current = this.getSettings();
      const updated = { ...current, ...newSettings };
      fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
      return updated;
    } catch (e) {
      logger.error('Error saving config.json', e);
      return this.getSettings();
    }
  }

  checkEvent(payload) {
    const { student_id, student_name, similarity_score, timestamp, camera_id } = payload;
    let isAlert = false;
    let alertReason = '';
    let isLateArrival = false;

    // Check 1: Similarity Score (Unknown Face)
    if (similarity_score < 0.60) {
      isAlert = true;
      alertReason = 'Low similarity score (Potential Unknown Face)';
    }

    // Check 2: Late Arrival 
    const eventDate = new Date(timestamp * 1000);
    const hours = eventDate.getHours();
    
    const settings = this.getSettings();
    const startHour = settings.LATE_HOUR_START || 9;
    const endHour = settings.LATE_HOUR_END || 15;

    if (startHour <= endHour) {
      if (hours >= startHour && hours < endHour) isLateArrival = true;
    } else {
      if (hours >= startHour || hours < endHour) isLateArrival = true;
    }

    if (isLateArrival) { 
      isAlert = true;
      alertReason = alertReason ? `${alertReason} & Late Arrival` : 'Late Arrival';
    }

    if (isAlert) {
      const alertPayload = {
        alert_type: 'SECURITY_WARNING',
        reason: alertReason,
        student_id,
        student_name: student_name || 'Unknown',
        similarity_score,
        camera_id,
        time: eventDate.toISOString()
      };

      logger.warn(`🚨 [ALERT] ${alertReason} for Student: ${student_id}`);
      
      try {
        const io = socketService.getIO();
        io.emit('security_alert', alertPayload);
      } catch (err) {
        logger.error('Could not emit socket event: Socket.IO not initialized.');
      }
      
      // If it was a late arrival or unauthorized exit, ALSO send a Telegram alert automatically!
      if (isLateArrival) {
         const action = (camera_id === 1 || camera_id === '1') ? 'exiting' : 'arriving';
         telegramService.sendLateEntryAlert(
           student_id, 
           eventDate.toISOString(), 
           `Automated Camera Alert: Detected ${action} at ${eventDate.toLocaleTimeString()} (Alert Threshold is ${startHour}:00)`
         );
      }
    }

    return isAlert;
  }
}

module.exports = new AlertService();
