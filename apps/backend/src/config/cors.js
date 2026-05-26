const cors = require('cors');

const allowedOrigins = [
  'https://aurenzashop.in',
  'https://www.aurenzashop.in',
  'https://admin.aurenzashop.in',
  process.env.BUYER_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-api-key', 'x-idempotency-key'],
};

module.exports = { corsOptions, allowedOrigins };
