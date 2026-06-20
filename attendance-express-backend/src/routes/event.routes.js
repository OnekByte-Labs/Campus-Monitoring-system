const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const authenticateApiKey = require('../middlewares/auth.middleware');

// POST /api/v1/events/attendance
// Protected by x-api-key middleware
router.post('/attendance', authenticateApiKey, eventController.receiveAttendance);

// GET /api/v1/events/attendance/today (Unprotected for dashboard)
router.get('/attendance/today', eventController.getTodayAttendance);

module.exports = router;
