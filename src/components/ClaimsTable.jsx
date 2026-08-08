import React, { memo, useEffect, useRef } from 'react'
import IconButton from './IconButton'

function ClaimsTable({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  statuses,
  handleSort,
  totalHeight,
  spacerTop,
  spacerBottom,
  visibleClaims,
  selectedClaim,
  setSelectedClaimId,
  setScrollTop,
  loadMoreClaims,
  loadedClaimCount,
  totalClaims,
  permissions,
  handleEditClick,
  handleDeleteClick,
  handleAssignClick,
}) {
  const scrollFrameRef = useRef(null)
  const pendingScrollTopRef = useRef(0)

  const handleTableScroll = (event) => {
    const node = event.currentTarget
    pendingScrollTopRef.current = node.scrollTop

    if (scrollFrameRef.current === null) {
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null
        setScrollTop(pendingScrollTopRef.current)
      })
    }

    if (loadedClaimCount >= totalClaims) return
    const threshold = node.scrollHeight - node.clientHeight * 1.4
    if (node.scrollTop >= threshold) {
      loadMoreClaims()
    }
  }

  const handleTableWheel = (event) => {
    const node = event.currentTarget
    const isScrollingDown = event.deltaY > 0
    const isScrollingUp = event.deltaY < 0
    const atTop = node.scrollTop <= 0
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1

    if ((isScrollingDown && atBottom) || (isScrollingUp && atTop)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current)
    }
  }, [])

  return (
    <section className="panel panel-grid">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Grid experience</p>
          <h2>Claim ledger</h2>
        </div>
        <div className="panel-tools">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search claimant, assignee"
            aria-label="Search claims"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-shell">
        <div className="table-head">
          <button type="button" className="table-heading" onClick={() => handleSort('claimant')}>
            Claimant
          </button>
          <button type="button" className="table-heading" onClick={() => handleSort('status')}>
            Status
          </button>
          <button type="button" className="table-heading" onClick={() => handleSort('riskScore')}>
            Risk
          </button>
          <button type="button" className="table-heading" onClick={() => handleSort('assignee')}>
            Assignee
          </button>
          <span className="table-heading">Actions</span>
        </div>

        <div className="table-body" onScroll={handleTableScroll} onWheel={handleTableWheel}>
          <div style={{ height: `${totalHeight}px` }}>
            <div style={{ height: `${spacerTop}px` }} />
            {visibleClaims.map((claim) => (
              <div
                key={claim.id}
                role="button"
                tabIndex={0}
                className={`table-row ${selectedClaim?.id === claim.id ? 'active' : ''}`}
                onClick={() => setSelectedClaimId(claim.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedClaimId(claim.id)
                  }
                }}
              >
                <span>{claim.claimant}</span>
                <span>{claim.status}</span>
                <span>{claim.riskScore}</span>
                <span>{claim.assignee}</span>
                <span className="row-actions">
                  <IconButton icon="edit" onClick={(e) => { e.stopPropagation(); handleEditClick(e) }} disabled={!permissions.canEdit} ariaLabel={`Edit ${claim.claimant}`} title="Edit" dataId={claim.id} />
                  <IconButton icon="assign" onClick={(e) => { e.stopPropagation(); handleAssignClick(e) }} disabled={!permissions.canAssign} ariaLabel={`Assign ${claim.claimant}`} title="Assign" dataId={claim.id} />
                  <IconButton icon="delete" onClick={(e) => { e.stopPropagation(); handleDeleteClick(e) }} disabled={!permissions.canDelete} ariaLabel={`Delete ${claim.claimant}`} title="Delete" dataId={claim.id} />
                </span>
              </div>
            ))}
            <div style={{ height: `${spacerBottom}px` }} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(ClaimsTable)