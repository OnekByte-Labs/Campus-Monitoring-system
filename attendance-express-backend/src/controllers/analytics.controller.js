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

  /**
   * GET /api/v1/analytics/dashboard
   * Retrieves high-level stats: totalEnrolled, currentlyInside, currentlyOutside, lateEntriesToday
   */
  async getDashboardStats(req, res, next) {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // 1. Total Enrolled
      const totalEnrolled = await prisma.student.count();

      // 2. Currently Inside (Calculate using latest log per student)
      // Since we don't have a direct raw query easy here without writing raw SQL, 
      // we'll get the latest log for all students.
      // Easiest is to fetch all logs ordered by timestamp DESC, then group manually by student ID.
      // For large production DBs, a RAW SQL query with DISTINCT ON (student_id) is better.
      const allLogs = await prisma.attendanceLog.findMany({
        orderBy: { timestamp: 'desc' },
      });

      const latestLogsMap = new Map();
      allLogs.forEach(log => {
        if (!latestLogsMap.has(log.student_id)) {
          latestLogsMap.set(log.student_id, log.direction);
        }
      });

      let currentlyInside = 0;
      latestLogsMap.forEach((direction) => {
        if (direction === 'IN') {
          currentlyInside++;
        }
      });

      // 3. Currently Outside
      const currentlyOutside = totalEnrolled - currentlyInside;

      // 4. Late Entries Today
      const lateEntriesToday = await prisma.attendanceLog.count({
        where: {
          is_late: true,
          timestamp: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          totalEnrolled,
          currentlyInside,
          currentlyOutside,
          lateEntriesToday
        }
      });
    } catch (error) {
      logger.error('Error calculating dashboard stats', error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
