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

      // 3. Currently Outside (Prevent negative if test data has orphaned logs)
      const currentlyOutside = Math.max(0, totalEnrolled - currentlyInside);

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

  /**
   * GET /api/v1/analytics/occupancy
   * Retrieves the list of students currently inside the hostel
   */
  async getCurrentOccupancy(req, res, next) {
    try {
      // Fetch all logs ordered by timestamp DESC
      const allLogs = await prisma.attendanceLog.findMany({
        orderBy: { timestamp: 'desc' },
      });

      const latestLogsMap = new Map();
      allLogs.forEach(log => {
        if (!latestLogsMap.has(log.student_id)) {
          latestLogsMap.set(log.student_id, log);
        }
      });

      const studentsInside = [];
      latestLogsMap.forEach((log) => {
        if (log.direction === 'IN') {
          studentsInside.push({
            student_id: log.student_id,
            student_name: log.student_name,
            entry_time: log.timestamp,
            is_late: log.is_late
          });
        }
      });

      return res.status(200).json({
        success: true,
        count: studentsInside.length,
        data: studentsInside
      });
    } catch (error) {
      logger.error('Error getting current occupancy', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/analytics/seed
   * Seeds the database with mock data for testing
   */
  async seedMockData(req, res, next) {
    try {
      // Clear existing
      await prisma.attendanceLog.deleteMany({});
      await prisma.student.deleteMany({});

      const students = [
        { student_id: 'STU-101', full_name: 'John Doe', room_number: '101' },
        { student_id: 'STU-102', full_name: 'Jane Smith', room_number: '102' },
        { student_id: 'STU-103', full_name: 'Alice Johnson', room_number: '103' },
        { student_id: 'STU-104', full_name: 'Bob Brown', room_number: '104' },
        { student_id: 'STU-105', full_name: 'Charlie Davis', room_number: '105' },
      ];

      for (const s of students) {
        await prisma.student.create({ data: { student_id: s.student_id, full_name: s.full_name, room_number: s.room_number } });
      }

      const createDate = (hoursOffset) => {
        const d = new Date();
        d.setHours(d.getHours() + hoursOffset);
        return d;
      };

      const logs = [
        { student_id: 'STU-101', student_name: 'John Doe', camera_id: 1, similarity_score: 0.95, direction: 'IN', timestamp: createDate(-3), is_late: false },
        { student_id: 'STU-102', student_name: 'Jane Smith', camera_id: 1, similarity_score: 0.92, direction: 'IN', timestamp: createDate(-4), is_late: false },
        { student_id: 'STU-102', student_name: 'Jane Smith', camera_id: 2, similarity_score: 0.88, direction: 'OUT', timestamp: createDate(-2), is_late: false },
        { student_id: 'STU-103', student_name: 'Alice Johnson', camera_id: null, similarity_score: 1.0, direction: 'IN', timestamp: createDate(-0.16), is_late: true, reason: 'Missed curfew due to late bus' },
        { student_id: 'STU-105', student_name: 'Charlie Davis', camera_id: 1, similarity_score: 0.96, direction: 'IN', timestamp: createDate(-5), is_late: false }
      ];

      for (const log of logs) {
        await prisma.attendanceLog.create({ data: log });
      }

      return res.status(200).json({ success: true, message: 'Mock data seeded successfully' });
    } catch (error) {
      logger.error('Error seeding mock data', error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
