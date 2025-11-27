const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const passport = require('passport');

const { logger } = require('./utils/logger');

// Validate required environment variables
if (
  !process.env.JWT_SECRET ||
  !process.env.JWT_REFRESH_SECRET ||
  !process.env.JWT_ACCESS_EXPIRES_IN ||
  !process.env.JWT_REFRESH_EXPIRES_IN_DAYS
) {
  logger.error('Missing required environment variables: JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN, or JWT_REFRESH_EXPIRES_IN_DAYS');
  process.exit(1);
}

require('./config/passport')(passport);

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookies (for reading signed cookies if needed)
app.use(cookieParser());
app.use(passport.initialize());

// Sanitization
app.use(mongoSanitize());
app.use(xssClean());

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter);

// Logging
app.use(morgan('combined'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const v1Base = '/api/v1';
app.use(`${v1Base}/auth`, require('./routes/auth.routes'));
app.use(`${v1Base}/users`, require('./routes/user.routes'));
app.use(`${v1Base}/products`, require('./routes/product.routes'));
app.use(`${v1Base}/carts`, require('./routes/cart.routes'));
app.use(`${v1Base}/orders`, require('./routes/order.routes'));
app.use(`${v1Base}/reports`, require('./routes/report.routes'));

// Swagger docs
app.use('/api-docs', require('./utils/swagger'));

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Favicon handler (browsers automatically request this)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Error handler
const { notFound, errorHandler } = require('./middlewares/error.middleware');
app.use(notFound);
app.use(errorHandler);

// Mongo connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  logger.error('MONGO_URI is required in .env file');
  process.exit(1);
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected');
    const port = process.env.PORT || 4000;
    app.listen(port, () => logger.info(`Server running on port ${port}`));
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
}

start();

module.exports = app;



