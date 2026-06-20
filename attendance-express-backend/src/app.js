require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const http = require('http');
const path = require('path');

// Custom Modules
const logger = require('./utils/logger');
const globalLimiter = require('./middlewares/rate-limit');
const eventRoutes = require('./routes/event.routes');
const studentRoutes = require('./routes/student.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const errorHandler = require('./middlewares/error.middleware');

// Services
const socketService = require('./services/socket.service');
const cronService = require('./services/cron.service');

// Initialize Express App
const app = express();

// --- LAYER 3: CLOUD API GATEWAY MIDDLEWARE STACK --- //

// 1. Security Headers
app.use(helmet());

// 2. CORS for Dashboard
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 3. Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Removed static file serving (frontend is now separate)

// 5. Structured Logging (HTTP Request Logging)
app.use(pinoHttp({ logger }));

// 6. Rate Limiting (Redis-backed)
app.use(globalLimiter);

// --- LAYER 4: MODULAR SERVICE ROUTES --- //

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Mount Routes
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/devices', require('./routes/device.routes'));
app.use('/api/v1/analytics', analyticsRoutes);

// --- GLOBAL ERROR HANDLING --- //
// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Centralized Error Middleware
app.use(errorHandler);

// --- SERVER INITIALIZATION --- //
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.IO Hub
socketService.init(server);

// Initialize Cron Jobs
cronService.init();

server.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
});

module.exports = server;
