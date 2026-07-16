const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const authenticateApiKey = require('../middlewares/auth.middleware');

// POST /api/v1/events/attendance
// Protected by x-api-key middleware
router.post('/attendance', authenticateApiKey, eventController.receiveAttendance);

// GET /api/v1/events/attendance/today (Unprotected for dashboard)
router.get('/attendance/today', eventController.getTodayAttendance);

// POST /api/v1/events/attendance/late-entry (Manual override)
router.post('/attendance/late-entry', authenticateApiKey, eventController.logLateEntry);

// GET /api/v1/events/feed/:camera_id (Proxy for Live Video Stream)
router.get('/feed/:camera_id', eventController.streamLiveFeed);

module.exports = router;
