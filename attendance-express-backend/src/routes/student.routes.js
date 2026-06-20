const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');

// POST /api/v1/students
router.post('/', studentController.registerStudent);

// GET /api/v1/students
router.get('/', studentController.getAllStudents);

// POST /api/v1/students/enroll-biometric
router.post('/enroll-biometric', studentController.triggerRemoteEnrollment);

module.exports = router;
