const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class EventService {
  /**
   * Insert an attendance log into the PostgreSQL database using Prisma
   * @param {Object} payload 
   * @returns {Object} inserted record
   */
  async logAttendance(payload) {
    try {
      const { student_id, student_name, timestamp, similarity_score, camera_id } = payload;
      
      const exactTime = new Date(timestamp * 1000);

      // Fetch the registered Device using camera_id (converted to string)
      const deviceIdStr = camera_id !== undefined ? String(camera_id) : 'UNKNOWN';
      const device = await prisma.device.findUnique({
        where: { device_id: deviceIdStr }
      });

      // Default to IN if device not found or no role defined
      const direction = device ? device.role : 'IN';

      // Auto-detect Late based on Global Settings (applies to both IN and OUT)
      let isLate = false;
      const fs = require('fs');
      const path = require('path');
      let startHour = 9;
      let endHour = 15;
      try {
        const configPath = path.join(__dirname, '../../config.json');
        if (fs.existsSync(configPath)) {
          const settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          startHour = settings.LATE_HOUR_START ?? 9;
          endHour = settings.LATE_HOUR_END ?? 15;
        }
      } catch (e) {}

      const hours = exactTime.getHours();
      
      if (startHour <= endHour) {
        if (hours >= startHour && hours < endHour) isLate = true;
      } else {
        if (hours >= startHour || hours < endHour) isLate = true;
      }

      console.log(`[DEBUG] Final isLate=${isLate}`);

      const record = await prisma.attendanceLog.create({
        data: {
          student_id,
          student_name: student_name || "Unknown Student",
          camera_id: camera_id !== undefined ? parseInt(camera_id, 10) : null,
          similarity_score: parseFloat(similarity_score),
          timestamp: exactTime,
          direction: direction,
          is_late: isLate
        },
      });

      return record;
    } catch (error) {
      logger.error('Error in EventService.logAttendance', error);
      throw error;
    }
  }

  /**
   * Fetch today's attendance records
   * @returns {Array} List of records
   */
  async getTodayAttendance() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const records = await prisma.attendanceLog.findMany({
        where: {
          timestamp: {
            gte: today,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      return records;
    } catch (error) {
      logger.error('Error in EventService.getTodayAttendance', error);
      throw error;
    }
  }
}

module.exports = new EventService();
