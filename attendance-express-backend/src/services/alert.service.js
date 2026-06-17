const socketService = require('./socket.service');
const logger = require('../utils/logger');

class AlertService {
  /**
   * Security Interceptor: Checks attendance log for anomalies
   * @param {Object} payload 
   * @returns {boolean} true if an alert was triggered
   */
  checkEvent(payload) {
    const { student_id, student_name, similarity_score, timestamp, camera_id } = payload;
    let isAlert = false;
    let alertReason = '';

    // Check 1: Similarity Score (Unknown Face)
    if (similarity_score < 0.60) {
      isAlert = true;
      alertReason = 'Low similarity score (Potential Unknown Face)';
    }

    // Check 2: Late Arrival (Past 09:00 AM Local Time)
    // timestamp is in seconds from epoch
    const eventDate = new Date(timestamp * 1000);
    const hours = eventDate.getHours();
    const minutes = eventDate.getMinutes();

    // 9 AM = hours >= 9 (simplified logic)
    if (hours >= 9 && hours < 15) { // Assuming school hours
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
      
      // Emit to all connected frontend clients
      try {
        const io = socketService.getIO();
        io.emit('security_alert', alertPayload);
      } catch (err) {
        logger.error('Could not emit socket event: Socket.IO not initialized.');
      }
    }

    return isAlert;
  }
}

module.exports = new AlertService();
