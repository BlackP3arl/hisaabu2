import { errorResponse } from '../utils/response.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        'Authentication token required',
        null,
        401
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        'Authentication token required',
        null,
        401
      );
    }

    // Verify token
    try {
      const decoded = verifyToken(token, false);
      
      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(
          res,
          'UNAUTHORIZED',
          'Token expired',
          null,
          401
        );
      }

      if (error.name === 'JsonWebTokenError') {
        return errorResponse(
          res,
          'UNAUTHORIZED',
          'Invalid token',
          null,
          401
        );
      }

      throw error;
    }
  } catch (error) {
    return errorResponse(
      res,
      'UNAUTHORIZED',
      'Authentication failed',
      null,
      401
    );
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token, false);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        'Authentication required',
        null,
        401
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        'FORBIDDEN',
        'Insufficient permissions',
        null,
        403
      );
    }

    next();
  };
};



