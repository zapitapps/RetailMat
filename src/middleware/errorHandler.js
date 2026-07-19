const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  
  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path
  });

  // Never leak stack traces in production
  const isProd = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isProd ? 'Something went wrong. Please try again.' : err.message,
      request_id: requestId
    }
  });
}

module.exports = errorHandler;
