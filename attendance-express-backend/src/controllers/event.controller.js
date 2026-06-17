const eventService = require('../services/event.service');
const logger = require('../utils/logger');

class EventController {
  /**
   * Handle incoming attendance POST request from the Jetson Nano
   */
  async receiveAttendance(req, res, next) {
    try {
      const { student_id, student_name, timestamp, similarity_score, device_id, camera_id } = req.body;

      // Basic Validation
      if (!student_id || !timestamp || similarity_score === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payload: missing required fields (student_id, timestamp, similarity_score)',
        });
      }

      logger.info(`Received attendance event from Device [${device_id || 'Unknown'}] for Student: ${student_id}`);

      // Intercept and check for Security Alerts before logging
      const alertService = require('../services/alert.service');
      alertService.checkEvent({
        student_id,
        student_name,
        similarity_score,
        timestamp,
        camera_id
      });

      // Call Service Layer to handle DB logic
      const record = await eventService.logAttendance({
        student_id,
        student_name,
        timestamp,
        similarity_score,
        camera_id,
      });

      return res.status(201).json({
        success: true,
        message: 'Attendance logged successfully',
        data: record,
      });
    } catch (error) {
      next(error); // Pass to global error handler
    }
  }
}

module.exports = new EventController();
