import React from 'react'

export default function SummaryGrid({ filteredClaims, selectedClaim, workspaceDoc, formatBytes }) {
  return (
    <section className="summary-grid">
      <article className="summary-card accent">
        <p>Records loaded</p>
        <strong>{filteredClaims.length.toLocaleString()} / 20,000+</strong>
        <span>Virtualized grid keeps interaction smooth.</span>
      </article>
      <article className="summary-card">
        <p>Current claim and status</p>
        <strong>{selectedClaim?.claimant ?? 'No claim'}</strong>
        <span>{selectedClaim?.status ?? 'N/A'}</span>
      </article>
      <article className="summary-card">
        <p>Document stream</p>
        <strong>{workspaceDoc?.totalPages ?? 0} pages</strong>
        <span>{formatBytes(workspaceDoc?.sizeBytes ?? 0)}</span>
      </article>
      <article className="summary-card">
        <p>Assignee</p>
        <strong>{selectedClaim?.assignee ?? 'Unassigned'}</strong>
        <span>Current claim owner</span>
      </article>
    </section>
  )
}