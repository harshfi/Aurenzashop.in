const windows = new Map();

const getClientKey = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const createRateLimiter = ({ windowMs, max, keyPrefix = 'global', message }) => {
  return (req, res, next) => {
    const now = Date.now();
    const clientKey = `${keyPrefix}:${getClientKey(req)}`;

    const existing = windows.get(clientKey);
    if (!existing || now - existing.start >= windowMs) {
      windows.set(clientKey, { start: now, count: 1 });
      return next();
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryInSeconds = Math.ceil((windowMs - (now - existing.start)) / 1000);
      res.setHeader('Retry-After', retryInSeconds);
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
      });
    }

    return next();
  };
};

const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GLOBAL_PER_MIN || 300),
  keyPrefix: 'global',
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_PER_15_MIN || 25),
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please try again after some time.',
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter,
};
