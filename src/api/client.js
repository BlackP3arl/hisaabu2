// src/api/client.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses (token refresh)
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const isPublicRoute = originalRequest.url?.includes('/public/')
    const isSharePage = window.location.pathname?.startsWith('/share/')

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh token for public routes or share pages
      // These routes handle 401 differently (e.g., password prompts)
      if (isPublicRoute || isSharePage) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/auth/refresh`,
            { refreshToken }
          )
          
          if (data.success && data.data.token) {
            localStorage.setItem('accessToken', data.data.token)
            if (data.data.refreshToken) {
              localStorage.setItem('refreshToken', data.data.refreshToken)
            }
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${data.data.token}`
            return apiClient(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          // Don't redirect if on public/share pages
          if (!isSharePage && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, clear everything and redirect
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        // Don't redirect if on public/share pages
        if (!isSharePage && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient


