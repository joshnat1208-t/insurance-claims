// Base URL for your API backend
const API_BASE_URL = 'http://localhost:5000/api'

// Helper import for fallback claims data
import { buildClaims } from '../claimsData'

export const AuthLogin = {
  /**
   * Login: Real API first -> Mock Fallback
   */
  login: async (email, password, role) => {
    try {
      console.log('Attempting real API login call...')
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })

      if (!response.ok) throw new Error(`Server status ${response.status}`)
      const data = await response.json()

      if (data?.token && data?.user) return data
      throw new Error('Invalid login response structure')
    } catch (error) {
      console.warn('Login API failed, falling back to mock response:', error.message)
      await new Promise((resolve) => setTimeout(resolve, 300))

      const mockUser = {
        id: 'usr_101',
        email: email || 'admin@abc.com',
        username: email ? email.split('@')[0] : 'admin',
        role: role || 'admin',
      }
      return {
        token: 'mock_jwt_token_string',
        user: mockUser,
      }
    }
  },

  /**
   * Verify Token: Real API first -> Mock Fallback
   */
  verifyToken: async (token) => {
    if (!token) throw new Error('No token provided')

    try {
      console.log('Attempting real API verifyToken call...')
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error(`Server status ${response.status}`)
      const data = await response.json()
      const payload = data.payload || data.user || data

      if (payload) return payload
      throw new Error('Invalid verify response structure')
    } catch (error) {
      console.warn('VerifyToken API failed, falling back to mock response:', error.message)
      await new Promise((resolve) => setTimeout(resolve, 300))

      return {
        sub: 'usr_101',
        email: 'admin@abc.com',
        username: 'admin',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
    }
  },

  /**
   * Fetch Claims: Real API first -> Mock Fallback
   */
  fetchClaims: async ({ search, status, sortKey, sortDir, token }) => {
    try {
      console.log('Attempting real API fetchClaims call...')
      
      // Build query string params
      const query = new URLSearchParams({
        search: search || '',
        status: status || 'All',
        sortKey: sortKey || 'claimant',
        sortDir: sortDir || 'asc',
      }).toString()

      const response = await fetch(`${API_BASE_URL}/claims?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized')
      }

      if (!response.ok) throw new Error(`Server status ${response.status}`)

      const data = await response.json()
      
      // Expected structure from server: { data: [...], totalItems: 20000 }
      if (Array.isArray(data) || Array.isArray(data?.data)) {
        return {
          data: data.data || data,
          totalItems: data.totalItems || data.length,
        }
      }

      throw new Error('Invalid claims response format')
    } catch (error) {
      // Re-throw 401 Unauthorized so App.js handles logout correctly
      if (error.message.includes('Unauthorized')) {
        throw error
      }

      console.warn('FetchClaims API failed, falling back to mock response:', error.message)
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Generate local mock fallback data (20,000 items)
      const mockList = buildClaims(20000, 0)
      return {
        data: mockList,
        totalItems: mockList.length,
      }
    }
  },

  /**
   * Create User: Real API first -> Mock Fallback
   */
  createUser: async (newUser) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) throw new Error(`Server status ${response.status}`)
      return await response.json()
    } catch (error) {
      console.warn('CreateUser API failed, falling back to mock response:', error.message)
      await new Promise((resolve) => setTimeout(resolve, 300))

      return {
        id: 'usr_' + Date.now(),
        ...newUser,
      }
    }
  },
}