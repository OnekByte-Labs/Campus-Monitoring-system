const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

class AnalyticsController {
  /**
   * GET /api/v1/analytics/today
   * Retrieves today's attendance and alert statistics
   */
  async getDailyStats(req, res, next) {
    try {
      // Define the start and end of "today"
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // 1. Total walk-throughs today (count of all logs today)
      const totalWalkThroughs = await prisma.attendanceLog.count({
        where: {
          timestamp: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // 2. Total unique students today
      // Prisma doesn't have a direct distinct count yet, so we use groupBy
      const uniqueStudentsGroup = await prisma.attendanceLog.groupBy({
        by: ['student_id'],
        where: {
          timestamp: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
      const uniqueStudents = uniqueStudentsGroup.length;

      // 3. Total alerts / late arrivals (score < 0.60 or timestamp hours >= 9)
      // We can count rows matching these conditions
      const totalAlerts = await prisma.attendanceLog.count({
        where: {
          timestamp: {
            gte: startOfDay,
            lte: endOfDay
          },
          OR: [
            { similarity_score: { lt: 0.60 } },
            // Approximation for late arrivals (we can't easily query extracted hours in basic Prisma, 
            // so we do it by creating a Date object for 09:00 AM today and checking if timestamp > that)
          ]
        }
      });

      // Refined Late Arrival Query: Count where timestamp > today's 09:00 AM
      const lateThreshold = new Date();
      lateThreshold.setHours(9, 0, 0, 0);

      const lateArrivals = await prisma.attendanceLog.count({
        where: {
          timestamp: {
            gte: lateThreshold,
            lte: endOfDay
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          totalWalkThroughs,
          uniqueStudents,
          totalAlerts: totalAlerts + lateArrivals, // combining for simplicity
          date: startOfDay.toISOString().split('T')[0]
        }
      });

    } catch (error) {
      logger.error('Error calculating analytics', error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
