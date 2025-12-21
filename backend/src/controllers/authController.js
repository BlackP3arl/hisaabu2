import bcrypt from 'bcrypt';
import { findUserByEmail, createUser, emailExists } from '../queries/users.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { successResponse, errorResponse, toCamelCase } from '../utils/response.js';
import { isValidEmail, validatePasswordStrength } from '../utils/validators.js';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || name.trim().length < 2 || name.trim().length > 255) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Name must be between 2 and 255 characters',
        { name: ['Name must be between 2 and 255 characters'] },
        422
      );
    }

    if (!email || !isValidEmail(email)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Valid email is required',
        { email: ['Valid email is required'] },
        422
      );
    }

    if (!password) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Password is required',
        { password: ['Password is required'] },
        422
      );
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        passwordValidation.message,
        { password: [passwordValidation.message] },
        422
      );
    }

    if (password !== confirmPassword) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Passwords do not match',
        { confirmPassword: ['Passwords do not match'] },
        422
      );
    }

    // Check if email already exists
    const exists = await emailExists(email);
    if (exists) {
      return errorResponse(
        res,
        'CONFLICT',
        'Email already exists',
        { email: ['Email already exists'] },
        409
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await createUser({
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
      role: 'staff', // Default role
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return response
    return successResponse(
      res,
      {
        user: toCamelCase(user),
        token,
        refreshToken,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Valid email is required',
        { email: ['Valid email is required'] },
        422
      );
    }

    if (!password) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Password is required',
        { password: ['Password is required'] },
        422
      );
    }

    // Find user
    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        'Invalid email or password',
        null,
        401
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        'Invalid email or password',
        null,
        401
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Calculate expiration (1 hour = 3600 seconds)
    const expiresIn = 3600;

    // Return response
    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        refreshToken,
        expiresIn,
      },
      'Login successful',
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Refresh token is required',
        { refreshToken: ['Refresh token is required'] },
        422
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken, true);
    } catch (error) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        'Invalid or expired refresh token',
        null,
        401
      );
    }

    // Generate new access token
    const tokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    const token = generateAccessToken(tokenPayload);
    const expiresIn = 3600; // 1 hour

    return successResponse(
      res,
      {
        token,
        expiresIn,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res) => {
  // For now, logout is handled client-side by removing tokens
  // In the future, we could implement token blacklisting here
  return successResponse(
    res,
    null,
    'Logged out successfully',
    200
  );
};


