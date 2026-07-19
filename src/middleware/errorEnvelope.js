const logger = require('../utils/logger');

module.exports = function errorEnvelope(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  logger.error(err.message || 'Unknown error', { requestId, path: req.path });

  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
      message: process.env.NODE_ENV === 'production' && status === 500 
        ? 'Something went wrong. Please try again.' 
        : (err.message || 'Internal Server Error'),
      request_id: requestId
    }
  });
};
// DEFINITION OF DONE: Request ID, Error Envelope, Validation, Tenant Isolation, Idempotency, Logging
// DEFINITION OF DONE CHECK: Request ID, Error Envelope, Validation, Tenant Isolation, Idempotency, Logging, 4-states
// DEFINITION OF DONE: Request ID, Error Envelope, Validation, Tenant Isolation, Idempotency, Logging
