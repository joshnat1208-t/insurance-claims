import {
  ROLE_PERMISSIONS,
  STATUSES,
  buildClaims,
  createDocumentSnapshot,
} from '../claimsData'

// Simulated network delay for UI responsiveness/spinners
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// 1. Pre-generate mock claims dataset in memory
let mockClaims = typeof buildClaims === 'function' ? buildClaims(20000, 0) : []

// 2. Mock users table configured for authorized user profiles
let mockUsers = [
  { id: 'u1', username: 'admin_user', email: 'admin@abc.com', role: 'admin' },
  { id: 'u2', username: 'reviewer_user', email: 'reviewer@abc.com', role: 'reviewer' },
  { id: 'u3', username: 'adjuster_user', email: 'adjuster@abc.com', role: 'adjuster' },
]

// Cache Configuration (Default: 5 minutes expiration)
const CACHE_KEY_PREFIX = 'claims_app_cache_'
const CACHE_TTL_MS = 5 * 60 * 1000 

/**
 * Browser Storage Caching Helpers
 */
const cacheStorage = {
  get: (key) => {
    try {
      const itemStr = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      const now = Date.now()

      // Check if cache entry has expired
      if (now > item.expiry) {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`)
        return null
      }
      return item.value
    } catch (err) {
      console.warn('Failed to read from browser cache:', err)
      return null
    }
  },

  set: (key, value, ttl = CACHE_TTL_MS) => {
    try {
      const item = {
        value,
        expiry: Date.now() + ttl,
      }
      localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(item))
    } catch (err) {
      console.warn('Failed to save to browser cache:', err)
    }
  },

  clear: (keyPrefix = '') => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`${CACHE_KEY_PREFIX}${keyPrefix}`)) {
          localStorage.removeItem(key)
        }
      })
    } catch (err) {
      console.warn('Failed to clear browser cache:', err)
    }
  },
}

export const claimsApi = {
  /**
   * 1. Authenticate User
   */
// AFTER (Fixed)
login: async (email, password) => {
  await delay(300)

  const userEmail = email ? email.trim().toLowerCase() : 'admin@abc.com'
  const matchedUser = mockUsers.find((u) => u.email.toLowerCase() === userEmail)

  if (matchedUser) {
    return {
      token: `mock-jwt-token-${Date.now()}`,
      user: matchedUser,
    }
  }

  // Determine role dynamically based on the email address
  let derivedRole = 'admin'
  if (userEmail.includes('adjuster')) {
    derivedRole = 'adjuster'
  } else if (userEmail.includes('reviewer')) {
    derivedRole = 'reviewer'
  }

  const rawUsername = userEmail.includes('@') ? userEmail.split('@')[0] : 'user'
  const username = rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1)

  return {
    token: `mock-jwt-token-${Date.now()}`,
    user: {
      id: `u_${Date.now()}`,
      username,
      email: userEmail,
      role: derivedRole,
    },
  }
},

  /**
   * 2. Create New User
   */
  createUser: async (userData) => {
    await delay(300)

    if (!userData.username || !userData.email || !userData.role) {
      throw new Error('Validation failed: Missing username, email, or role.')
    }

    const newUser = {
      id: `u_${Date.now()}`,
      username: userData.username,
      email: userData.email,
      role: userData.role,
    }

    mockUsers.push(newUser)
    return newUser
  },

  /**
   * 3. Fetch Paginated / Filtered / Sorted Claims (With Browser Caching)
   */
  fetchClaims: async ({
    page = 1,
    limit = 20000,
    search = '',
    status = 'All',
    sortKey = 'claimant',
    sortDir = 'asc',
  } = {}) => {
    // Generate a unique cache key based on query parameters
    const cacheKey = `claims_${page}_${limit}_${search}_${status}_${sortKey}_${sortDir}`

    // 1. Check if response is cached in browser storage
    const cachedData = cacheStorage.get(cacheKey)
    if (cachedData) {
      return cachedData
    }

    await delay(250)

    let filtered = [...mockClaims]

    // Search Filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim()
      filtered = filtered.filter(
        (claim) =>
          (claim.claimant && claim.claimant.toLowerCase().includes(q)) ||
          (claim.policy && claim.policy.toLowerCase().includes(q)) ||
          String(claim.id).includes(q)
      )
    }

    // Status Filter
    if (status && status !== 'All') {
      filtered = filtered.filter(
        (claim) => claim.status && claim.status.toLowerCase() === status.toLowerCase()
      )
    }

    // Sorting
    if (sortKey) {
      filtered.sort((a, b) => {
        let valA = a[sortKey] ?? ''
        let valB = b[sortKey] ?? ''

        if (typeof valA === 'string') {
          valA = valA.toLowerCase()
          valB = valB.toLowerCase()
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    // Pagination
    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / limit) || 1
    const startIndex = (page - 1) * limit
    const paginatedData = filtered.slice(startIndex, startIndex + limit)

    const response = {
      data: paginatedData,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasMore: page < totalPages,
      },
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasMore: page < totalPages,
    }

    // 2. Save response into browser cache
    cacheStorage.set(cacheKey, response)

    return response
  },

  /**
   * 4. Fetch Document Snapshot (With Browser Caching)
   */
  fetchDocumentSnapshot: async (claimId) => {
    const cacheKey = `snapshot_${claimId}`
    const cachedSnapshot = cacheStorage.get(cacheKey)

    if (cachedSnapshot) {
      return cachedSnapshot
    }

    await delay(200)
    const claim = mockClaims.find(
      (c) => c.id === Number(claimId) || String(c.id) === String(claimId)
    )

    let result = null
    if (claim && typeof createDocumentSnapshot === 'function') {
      result = createDocumentSnapshot(claim)
    } else {
      result = {
        id: claimId,
        pages: Array.from({ length: 19 }, (_, i) => ({
          pageNumber: i + 1,
          commentsCount: i % 5 === 0 ? 1 : 0,
        })),
      }
    }

    cacheStorage.set(cacheKey, result)
    return result
  },

  /**
   * 5. Update Existing Claim (Invalidates Browser Cache)
   */
  updateClaim: async (claimId, updates) => {
    await delay(250)
    let updatedClaim = null

    mockClaims = mockClaims.map((claim) => {
      if (claim.id === Number(claimId) || String(claim.id) === String(claimId)) {
        updatedClaim = { ...claim, ...updates }
        return updatedClaim
      }
      return claim
    })

    // Invalidate claims cache so UI re-fetches updated values
    cacheStorage.clear('claims_')
    cacheStorage.clear(`snapshot_${claimId}`)

    return updatedClaim || { id: claimId, ...updates }
  },

  /**
   * 6. Delete Claim (Invalidates Browser Cache)
   */
  deleteClaim: async (claimId) => {
    await delay(250)
    mockClaims = mockClaims.filter(
      (c) => c.id !== Number(claimId) && String(c.id) !== String(claimId)
    )

    // Invalidate claims cache so UI re-fetches updated values
    cacheStorage.clear('claims_')
    cacheStorage.clear(`snapshot_${claimId}`)

    return { success: true, id: claimId }
  },

  /**
   * Helper to clear entire app cache manually (e.g. on Logout)
   */
  clearCache: () => {
    cacheStorage.clear()
  },
}