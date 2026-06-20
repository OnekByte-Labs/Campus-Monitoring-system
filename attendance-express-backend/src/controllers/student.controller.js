const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

class StudentController {
  async createStudent(req, res, next) {
    try {
      const { student_id, full_name, enrollment_status } = req.body;

      if (!student_id || !full_name) {
        return res.status(400).json({ success: false, error: 'Missing student_id or full_name' });
      }

      // Upsert student so it doesn't fail on duplicate runs
      const student = await prisma.student.upsert({
        where: { student_id },
        update: { full_name, enrollment_status: enrollment_status || 'ACTIVE' },
        create: {
          student_id,
          full_name,
          enrollment_status: enrollment_status || 'ACTIVE'
        }
      });

      logger.info(`Student created/updated: ${student.student_id}`);

      return res.status(201).json({
        success: true,
        message: 'Student registered successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController();
