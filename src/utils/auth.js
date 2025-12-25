// src/utils/auth.js

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return false
  
  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]))
    const isExpired = payload.exp * 1000 < Date.now()
    
    if (isExpired) {
      // Token expired, try to refresh
      return false
    }
    
    return true
  } catch {
    // Invalid token format
    return false
  }
}

/**
 * Get current user from localStorage
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * Store authentication tokens and user data
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @param {object} user - User object
 */
export const setAuth = (accessToken, refreshToken, user) => {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('user', JSON.stringify(user))
}

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

/**
 * Get access token
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return localStorage.getItem('accessToken')
}

/**
 * Get refresh token
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken')
}


