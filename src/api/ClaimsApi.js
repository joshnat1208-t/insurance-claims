import { buildClaims } from '../claimsData'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

export const claimsApi = {
  /**
   * Fetch Claims with query parameters (search, status, sorting)
   * Real API first -> Mock Fallback (20,000 virtualized records)
   */
  fetchClaims: async ({ search = '', status = 'All', sortKey = 'claimant', sortDir = 'asc', token }) => {
    try {
      console.log('Attempting real API fetchClaims call...')

      const query = new URLSearchParams({
        search,
        status,
        sortKey,
        sortDir,
      }).toString()

      const response = await fetch(`${API_BASE_URL}/claims?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('auth_token')}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`)
      }

      const data = await response.json()

      // Supports array directly or structured pagination object { data: [], totalItems: 20000 }
      if (Array.isArray(data) || Array.isArray(data?.data)) {
        return {
          data: data.data || data,
          totalItems: data.totalItems || data.length,
        }
      }

      throw new Error('Invalid claims payload format')
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        throw error // Rethrow to trigger logout handler in App.js
      }

      console.warn('Claims API failed, falling back to mock response:', error.message)
      await new Promise((resolve) => setTimeout(resolve, 300))

      const mockList = buildClaims(20000, 0)
      return {
        data: mockList,
        totalItems: mockList.length,
      }
    }
  },

  /**
   * Fetch single claim details by ID
   */
  getClaimById: async (claimId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/claims/${claimId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('auth_token')}`,
        },
      })

      if (!response.ok) throw new Error(`Server returned status ${response.status}`)
      return await response.json()
    } catch (error) {
      console.warn(`GetClaimById API failed for ID ${claimId}, using mock fallback:`, error.message)
      await new Promise((resolve) => setTimeout(resolve, 200))
      
      const mockList = buildClaims(100, 0)
      return mockList.find((c) => c.id === claimId) || mockList[0]
    }
  },

  /**
   * Update claim details/status
   */
  updateClaim: async (claimId, updateData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error(`Server returned status ${response.status}`)
      return await response.json()
    } catch (error) {
      console.warn(`UpdateClaim API failed for ID ${claimId}, using mock fallback:`, error.message)
      await new Promise((resolve) => setTimeout(resolve, 200))

      return { id: claimId, ...updateData }
    }
  },
}