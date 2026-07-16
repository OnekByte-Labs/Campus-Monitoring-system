const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// GET /api/v1/analytics/today
router.get('/today', analyticsController.getDailyStats);

// GET /api/v1/analytics/dashboard
router.get('/dashboard', analyticsController.getDashboardStats);

module.exports = router;
