const logger = require('../utils/logger');

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.JETSON_API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing x-api-key',
    });
  }

  next();
};

module.exports = authenticateApiKey;
