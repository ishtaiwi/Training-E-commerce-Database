const { logger } = require('../utils/logger');

function notFound(req, res, next) {
  // Handle favicon requests silently (browsers automatically request this)
  if (req.originalUrl === '/favicon.ico') {
    return res.status(204).end();
  }
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode);

  const response = {
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  // Don't log errors for favicon requests (browsers automatically request this)
  const isFavicon = req.originalUrl === '/favicon.ico';
  if (!isFavicon) {
    logger.error('Request failed', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message: err.message,
    });
  }

  res.json(response);
}

module.exports = { notFound, errorHandler };


