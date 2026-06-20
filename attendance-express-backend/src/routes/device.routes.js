const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');

// POST /api/v1/devices
router.post('/', deviceController.registerDevice);

// GET /api/v1/devices
router.get('/', deviceController.getAllDevices);

// DELETE /api/v1/devices/:id
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
