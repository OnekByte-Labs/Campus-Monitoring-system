const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// GET /api/v1/analytics/today
router.get('/today', analyticsController.getDailyStats);

// GET /api/v1/analytics/dashboard
router.get('/dashboard', analyticsController.getDashboardStats);

// GET /api/v1/analytics/occupancy
router.get('/occupancy', analyticsController.getCurrentOccupancy);

// POST /api/v1/analytics/seed
router.post('/seed', analyticsController.seedMockData);

module.exports = router;
