const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

class StudentController {
  async registerStudent(req, res, next) {
    try {
      const { full_name, student_id, room_number } = req.body;

      if (!full_name || !student_id || !room_number) {
        return res.status(400).json({ success: false, error: 'full_name, student_id, and room_number are required' });
      }

      // Check if student already exists
      const existing = await prisma.student.findUnique({
        where: { student_id }
      });

      if (existing) {
        return res.status(409).json({ success: false, error: 'Student ID already exists' });
      }

      const student = await prisma.student.create({
        data: {
          full_name,
          student_id,
          room_number,
          status: 'ACTIVE'
        }
      });

      logger.info(`New student enrolled: ${student_id} - ${full_name}`);

      res.status(201).json({
        success: true,
        data: student
      });
    } catch (error) {
      logger.error('Error registering student:', error);
      next(error);
    }
  }

  async getAllStudents(req, res, next) {
    try {
      const students = await prisma.student.findMany({
        orderBy: {
          created_at: 'desc'
        }
      });

      res.status(200).json({
        success: true,
        data: students
      });
    } catch (error) {
      logger.error('Error fetching students:', error);
      next(error);
    }
  }
}

module.exports = new StudentController();
