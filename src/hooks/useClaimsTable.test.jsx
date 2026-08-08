import { renderHook } from '@testing-library/react'
import { buildClaims } from '../claimsData'
import useClaimsTable from './useClaimsTable'

describe('useClaimsTable', () => {
  it('filters by search and status and falls back to the first filtered claim', () => {
    const claims = buildClaims(12, 0)
    const setSortKey = vi.fn()
    const setSortDir = vi.fn()

    const { result } = renderHook(() => useClaimsTable({
      claims,
      search: 'claimant 2',
      statusFilter: 'In Review',
      sortKey: 'claimant',
      sortDir: 'asc',
      selectedClaimId: 999999,
      scrollTop: 0,
      rowHeight: 61,
      viewportHeight: 520,
      setSortKey,
      setSortDir,
    }))

    expect(result.current.filteredClaims).toHaveLength(1)
    expect(result.current.selectedClaim.claimant).toBe('Claimant 2')
  })

  it('searches only claimant and assignee fields', () => {
    const claims = buildClaims(12, 0)

    const { result } = renderHook(() => useClaimsTable({
      claims,
      search: 'approved',
      statusFilter: 'All',
      sortKey: 'claimant',
      sortDir: 'asc',
      selectedClaimId: claims[0].id,
      scrollTop: 0,
      rowHeight: 61,
      viewportHeight: 520,
      setSortKey: vi.fn(),
      setSortDir: vi.fn(),
    }))

    expect(result.current.filteredClaims).toHaveLength(0)
  })

  it('keeps claimant sorting in natural ascending order', () => {
    const claims = [
      { ...buildClaims(1, 9)[0], claimant: 'Claimant 10' },
      { ...buildClaims(1, 1)[0], claimant: 'Claimant 2' },
      { ...buildClaims(1, 0)[0], claimant: 'Claimant 1' },
    ]

    const { result } = renderHook(() => useClaimsTable({
      claims,
      search: '',
      statusFilter: 'All',
      sortKey: 'claimant',
      sortDir: 'asc',
      selectedClaimId: claims[0].id,
      scrollTop: 0,
      rowHeight: 61,
      viewportHeight: 520,
      setSortKey: vi.fn(),
      setSortDir: vi.fn(),
    }))

    expect(result.current.filteredClaims.map((claim) => claim.claimant)).toEqual([
      'Claimant 1',
      'Claimant 2',
      'Claimant 10',
    ])
  })

  it('sorts numeric fields and computes virtualization spacers', () => {
    const claims = buildClaims(40, 0)

    const { result } = renderHook(() => useClaimsTable({
      claims,
      search: '',
      statusFilter: 'All',
      sortKey: 'riskScore',
      sortDir: 'desc',
      selectedClaimId: claims[0].id,
      scrollTop: 100,
      rowHeight: 10,
      viewportHeight: 20,
      setSortKey: vi.fn(),
      setSortDir: vi.fn(),
    }))

    expect(result.current.filteredClaims[0].riskScore).toBeGreaterThanOrEqual(result.current.filteredClaims[1].riskScore)
    expect(result.current.visibleClaims).toHaveLength(18)
    expect(result.current.spacerTop).toBe(20)
    expect(result.current.totalHeight).toBe(400)
    expect(result.current.spacerBottom).toBe(200)
  })

  it('toggles sort direction for the same key and resets direction for a new key', () => {
    const setSortKey = vi.fn()
    const setSortDir = vi.fn()

    const { result } = renderHook(() => useClaimsTable({
      claims: buildClaims(3, 0),
      search: '',
      statusFilter: 'All',
      sortKey: 'claimant',
      sortDir: 'asc',
      selectedClaimId: 1000,
      scrollTop: 0,
      rowHeight: 61,
      viewportHeight: 520,
      setSortKey,
      setSortDir,
    }))

    result.current.handleSort('claimant')
    expect(setSortDir).toHaveBeenCalledWith(expect.any(Function))
    expect(setSortDir.mock.calls[0][0]('asc')).toBe('desc')

    result.current.handleSort('status')
    expect(setSortKey).toHaveBeenCalledWith('status')
    expect(setSortDir).toHaveBeenCalledWith('asc')
  })
})