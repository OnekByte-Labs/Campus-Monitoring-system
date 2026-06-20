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

  async triggerRemoteEnrollment(req, res, next) {
    try {
      const { student_id } = req.body;

      if (!student_id) {
        return res.status(400).json({ success: false, error: 'student_id is required' });
      }

      // Check if student actually exists in our DB first
      const existing = await prisma.student.findUnique({
        where: { student_id }
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Student ID not found in database. Please register the student first.' });
      }

      const jetsonIp = process.env.JETSON_NANO_IP || '192.168.1.100';
      const targetUrl = `http://${jetsonIp}:5001/start-enroll`;

      logger.info(`Triggering remote enrollment for student ${student_id} at ${targetUrl}`);

      const axios = require('axios');
      const response = await axios.post(targetUrl, { student_id }, { timeout: 10000 });

      res.status(200).json({
        success: true,
        message: `Remote enrollment triggered successfully on Jetson Nano.`,
        edgeResponse: response.data
      });

    } catch (error) {
      logger.error('Error triggering remote enrollment:', error.message);
      
      // Provide a helpful error if the Jetson is unreachable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({
          success: false,
          error: `Jetson Nano edge device is unreachable at ${process.env.JETSON_NANO_IP}:5001. Is it online?`
        });
      }

      next(error);
    }
  }
}

module.exports = new StudentController();
