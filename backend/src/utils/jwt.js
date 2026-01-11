import jwt from 'jsonwebtoken';

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (userId, email, role)
 * @returns {string} - JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    }
  );
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload (userId, email, role)
 * @returns {string} - Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: 'refresh',
    },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {boolean} isRefresh - Whether this is a refresh token
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token, isRefresh = false) => {
  const secret = isRefresh
    ? process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    : process.env.JWT_SECRET;

  return jwt.verify(token, secret);
};

/**
 * Decode JWT token without verification (for checking expiration)
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};



