import { useMemo } from 'react'

export default function useClaimsTable({
  claims,
  search,
  statusFilter,
  sortKey,
  sortDir,
  selectedClaimId,
  scrollTop,
  rowHeight,
  viewportHeight,
  setSortKey,
  setSortDir,
}) {
  const filteredClaims = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    const next = claims.filter((claim) => {
      const matchesSearch = !searchValue
        || claim.claimant.toLowerCase().includes(searchValue)
        || claim.assignee.toLowerCase().includes(searchValue)
      const matchesStatus = statusFilter === 'All' || claim.status === statusFilter
      return matchesSearch && matchesStatus
    })

    next.sort((left, right) => {
      const leftValue = left[sortKey]
      const rightValue = right[sortKey]
      const modifier = sortDir === 'asc' ? 1 : -1

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * modifier
      }

      return String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true }) * modifier
    })

    return next
  }, [claims, search, sortDir, sortKey, statusFilter])

  const selectedClaim = useMemo(
    () => filteredClaims.find((claim) => claim.id === selectedClaimId) ?? filteredClaims[0] ?? claims[0],
    [claims, filteredClaims, selectedClaimId],
  )

  const visibleCount = Math.ceil(viewportHeight / rowHeight) + 16
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 8)
  const endIndex = Math.min(filteredClaims.length, startIndex + visibleCount)
  const visibleClaims = filteredClaims.slice(startIndex, endIndex)
  const totalHeight = filteredClaims.length * rowHeight
  const spacerTop = startIndex * rowHeight
  const spacerBottom = Math.max(0, totalHeight - (endIndex * rowHeight))

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDir('asc')
  }

  return {
    filteredClaims,
    selectedClaim,
    visibleClaims,
    totalHeight,
    spacerTop,
    spacerBottom,
    handleSort,
  }
}