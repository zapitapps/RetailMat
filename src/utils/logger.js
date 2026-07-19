/**
 * VendrAI Professional Logger
 * Supports console + future Sentry integration
 * Created during 2026-07-09 modular refactor
 */

const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
  }

  _format(level, message, meta = {}) {
    const ts = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  info(message, meta = {}) {
    console.log(this._format('info', message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this._format('warn', message, meta));
  }

  error(message, meta = {}) {
    console.error(this._format('error', message, meta));
    
    // === FUTURE SENTRY INTEGRATION ===
    // if (isProduction && process.env.SENTRY_DSN) {
    //   Sentry.captureException(new Error(message), { extra: meta });
    // }
  }

  debug(message, meta = {}) {
    if (this.level === 'debug' || !isProduction) {
      console.debug(this._format('debug', message, meta));
    }
  }

  // For business events
  event(eventName, data = {}) {
    this.info(`EVENT: ${eventName}`, data);
  }
}

const logger = new Logger();
module.exports = logger;
