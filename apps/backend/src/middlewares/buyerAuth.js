const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Buyer Authentication Middleware
 * Validates the NextAuth session token sent from the buyer frontend.
 * The token is expected in the Authorization header as: Bearer <token>
 * 
 * The token is a JWT signed with NEXTAUTH_SECRET.
 * We decode it and find/create the user in MongoDB.
 */
const buyerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken =
      req.cookies?.['authjs.session-token'] ||
      req.cookies?.['__Secure-authjs.session-token'] ||
      req.cookies?.['next-auth.session-token'] ||
      req.cookies?.['__Secure-next-auth.session-token'] ||
      null;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    // Decode the NextAuth JWT
    // NextAuth v5 uses the AUTH_SECRET / NEXTAUTH_SECRET to sign tokens
    let decoded;
    try {
      const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
      if (!authSecret) {
        return res.status(500).json({
          success: false,
          message: 'Buyer authentication secret is not configured.',
        });
      }
      decoded = jwt.verify(token, authSecret);
    } catch (_err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    if (!decoded || !decoded.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }

    // Find or create the user in our database
    let user = await User.findOne({ email: decoded.email });

    if (!user) {
      // Auto-create user from OAuth data
      user = await User.create({
        name: decoded.name || 'User',
        email: decoded.email,
        authProvider: 'google',
        providerId: decoded.sub || null,
        avatarUrl: decoded.picture || null,
      });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = buyerAuth;
