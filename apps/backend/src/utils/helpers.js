/**
 * Utility Helpers — Aurenza Backend
 */

/**
 * Generate a unique order receipt ID
 * @returns {string}
 */
const generateReceiptId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AUR-${timestamp}-${random}`;
};

/**
 * Format INR currency
 * @param {number} amount
 * @returns {string}
 */
const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Async handler wrapper to avoid try-catch in every controller
 * @param {Function} fn - Express route handler
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  generateReceiptId,
  formatINR,
  asyncHandler,
};
