import { query } from '../config/database.js';

/**
 * User database queries
 */

/**
 * Find user by email
 */
export const findUserByEmail = async (email) => {
  const result = await query(
    'SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Find user by ID
 */
export const findUserById = async (userId) => {
  const result = await query(
    'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Create new user
 */
export const createUser = async (userData) => {
  const { email, passwordHash, name, role = 'staff' } = userData;
  
  const result = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, role, created_at, updated_at`,
    [email, passwordHash, name, role]
  );
  
  return result.rows[0];
};

/**
 * Check if email exists
 */
export const emailExists = async (email) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM users WHERE email = $1',
    [email]
  );
  return parseInt(result.rows[0].count) > 0;
};

/**
 * Update user password
 */
export const updateUserPassword = async (userId, passwordHash) => {
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );
};



