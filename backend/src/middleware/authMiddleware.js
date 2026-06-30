/**
 * CivicPulse — Auth Middleware
 * Verifies Firebase ID tokens and extracts user role from custom claims.
 * In mock mode, accepts "mock_<uid>_<role>" tokens.
 */
import { auth } from '../config/firebase.js';
import config from '../config/env.js';

/**
 * Middleware: require authentication
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In mock mode, allow requests with mock user header
    if (config.useMock) {
      req.user = {
        uid: req.headers['x-mock-uid'] || 'demo_citizen',
        role: req.headers['x-mock-role'] || 'citizen',
        email: 'demo@civicpulse.dev',
      };
      return next();
    }
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      role: decoded.role || 'citizen',
      email: decoded.email,
    };
    next();
  } catch (err) {
    console.error('Auth verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware factory: require specific role(s)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}
