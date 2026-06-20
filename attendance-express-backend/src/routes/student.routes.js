const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');

// POST /api/v1/students
router.post('/', studentController.createStudent);

module.exports = router;
