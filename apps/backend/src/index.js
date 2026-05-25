require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { corsOptions } = require('./config/cors');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// ===== Global Middlewares =====

// CORS
app.use(cors(corsOptions));

// Cookie parser
app.use(cookieParser());

// JSON parser (skip for webhook routes that need raw body)
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhooks/razorpay')) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

// URL-encoded parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Raw body for Razorpay webhooks (needed for signature verification)
app.use('/api/orders/webhooks/razorpay', express.raw({ type: 'application/json' }));

// ===== Health Check =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Aurenza API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ===== API Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ===== 404 Handler =====
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ===== Global Error Handler =====
app.use(errorHandler);

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║       🛍️  AURENZA API SERVER        ║
  ║──────────────────────────────────────║
  ║  Port:    ${PORT}                        ║
  ║  Env:     ${(process.env.NODE_ENV || 'development').padEnd(24)}║
  ║  Health:  http://localhost:${PORT}/api/health  ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
