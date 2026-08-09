// src/mocks/handlers.js
import { http, HttpResponse } from 'msw'

const BASE_URL = 'http://localhost:5000/api/v1'

// Generate 20,000 mock claims with statuses matching the UI filter bar
const TOTAL_RECORDS = 20000
const STATUSES = ['Pending', 'In Review', 'Approved', 'Rejected']
const RISKS = ['Low', 'Medium', 'High']

const mockDatabase = Array.from({ length: TOTAL_RECORDS }, (_, i) => ({
  id: 1000 + i,
  claimant: `Claimant ${i + 1}`,
  policy: `POL-${100000 + i}`,
  claimType: i % 2 === 0 ? 'Medical' : 'Auto',
  status: STATUSES[i % STATUSES.length],
  risk: RISKS[i % RISKS.length],
  assignee: i % 2 === 0 ? 'admin' : 'Unassigned',
  amount: (1200 + i * 15).toFixed(2),
  updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
}))

export const handlers = [
  // 1. POST Login
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json().catch(() => ({}))

    if (password === 'error') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const username = email ? email.split('@')[0] : 'admin_user'
    return HttpResponse.json({
      token: `mock-jwt-token-${Date.now()}`,
      user: { id: 'u1', username, email: email || 'admin@company.com', role: 'admin' },
    })
  }),

  // 2. GET Paginated, Filtered, and Sorted Claims
  http.get(`${BASE_URL}/claims`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const search = (url.searchParams.get('search') || '').toLowerCase().trim()
    const status = url.searchParams.get('status') || 'All'
    const sortKey = url.searchParams.get('sortKey') || 'claimant'
    const sortDir = url.searchParams.get('sortDir') || 'asc'

    // Server-side Filtering
    let filtered = mockDatabase.filter((claim) => {
      const matchesStatus = status === 'All' || claim.status.toLowerCase() === status.toLowerCase()
      const matchesSearch =
        !search ||
        claim.claimant.toLowerCase().includes(search) ||
        (claim.policy && claim.policy.toLowerCase().includes(search)) ||
        String(claim.id).includes(search)

      return matchesStatus && matchesSearch
    })

    // Server-side Sorting
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

    // Server-side Pagination Slicing
    const totalCount = filtered.length
    const totalPages = Math.ceil(totalCount / limit) || 1
    const startIndex = (page - 1) * limit
    const paginatedData = filtered.slice(startIndex, startIndex + limit)

    return HttpResponse.json({
      data: paginatedData,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasMore: page < totalPages,
      },
    })
  }),

  // 3. GET Document Snapshot
  http.get(`${BASE_URL}/claims/:id/snapshot`, ({ params }) => {
    const claimId = params.id
    return HttpResponse.json({
      id: claimId,
      pages: Array.from({ length: 19 }, (_, i) => ({
        pageNumber: i + 1,
        commentsCount: i % 5 === 0 ? 1 : 0,
      })),
    })
  }),

  // 4. PATCH Claim Update
  http.patch(`${BASE_URL}/claims/:id`, async ({ params, request }) => {
    const claimId = params.id
    const updates = await request.json().catch(() => ({}))
    return HttpResponse.json({ id: claimId, ...updates })
  }),

  // 5. DELETE Claim
  http.delete(`${BASE_URL}/claims/:id`, ({ params }) => {
    return HttpResponse.json({ success: true, id: params.id })
  }),
]