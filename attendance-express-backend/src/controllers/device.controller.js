const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

class DeviceController {
  async registerDevice(req, res, next) {
    try {
      const { device_id, name, role } = req.body;

      if (!device_id || !name || !role) {
        return res.status(400).json({ success: false, error: 'device_id, name, and role are required' });
      }

      // Check if device exists
      const existing = await prisma.device.findUnique({
        where: { device_id }
      });

      if (existing) {
        return res.status(409).json({ success: false, error: 'Device ID already exists' });
      }

      const device = await prisma.device.create({
        data: {
          device_id,
          name,
          role,
          status: 'ONLINE'
        }
      });

      logger.info(`New device registered: ${device_id} - ${name} (${role})`);

      res.status(201).json({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error('Error registering device:', error);
      next(error);
    }
  }

  async getAllDevices(req, res, next) {
    try {
      const devices = await prisma.device.findMany({
        orderBy: {
          created_at: 'desc'
        }
      });

      res.status(200).json({
        success: true,
        data: devices
      });
    } catch (error) {
      logger.error('Error fetching devices:', error);
      next(error);
    }
  }

  async deleteDevice(req, res, next) {
    try {
      const { id } = req.params;

      // Ensure the device exists
      const existing = await prisma.device.findUnique({
        where: { id }
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Device not found' });
      }

      // Check if device_id is a valid integer (since camera_id in logs is Int)
      const camId = parseInt(existing.device_id, 10);
      if (!isNaN(camId)) {
        try {
          await prisma.attendanceLog.deleteMany({
            where: { camera_id: camId }
          });
        } catch (logErr) {
          logger.warn(`Failed to delete associated logs for camera ${camId}: ${logErr.message}`);
        }
      }

      await prisma.device.delete({
        where: { id }
      });

      logger.info(`Device deleted: ${existing.device_id} - ${existing.name}`);

      res.status(200).json({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting device:', error);
      next(error);
    }
  }
}

module.exports = new DeviceController();
