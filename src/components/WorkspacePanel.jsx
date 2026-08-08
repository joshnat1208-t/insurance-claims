import React, { memo } from 'react'

function WorkspacePanel({
  selectedClaim,
  workspaceDoc,
  formatBytes,
  docProgress,
  docLoading,
  permissions,
  openSplitPreview,
  openMergePreview,
  canMergeNow,
  availablePackageCount,
  handlePageDelete,
  openEditModal,
  openAssignModal,
  approveSelectedClaim,
  rejectSelectedClaim,
  lastSplitBackup,
  undoSplit,
  lastMergeBackup,
  undoMerge,
  operationState,
  cancelOperation,
  lastError,
  handleOperation,
  currentPackageIndex,
  setCurrentPackageIndex,
  setSelectedPage,
  selectedPage,
  selectedPageData,
  commentDraft,
  setCommentDraft,
  handleAddComment,
  feedback,
}) {
  const isReviewer = permissions.label === 'Reviewer'
  const displayedPages = workspaceDoc?.packages?.length
    ? (workspaceDoc.packages[currentPackageIndex] || [])
    : (workspaceDoc?.pages || [])
  const visibleComments = selectedPageData?.comments ?? workspaceDoc?.claimComments ?? []
  const claimantComments = workspaceDoc?.claimComments ?? []

  const handleDocumentGridClick = (event) => {
    if (event.target.closest('.page-card')) return
    if (event.target.closest('.common-comment-box')) return
    if (selectedPage !== null && selectedPage !== undefined) {
      setSelectedPage(null)
    }
  }

  return (
    <section className="panel panel-workspace">
      <div className="panel-header stacked">
        <div>
          <p className="eyebrow">Document workspace</p>
          <h2>{selectedClaim?.claimant ?? 'No claim selected'}</h2>
        </div>
      </div>

      <div className="workspace-card">
        <div className="document-header">
          <div>
            <h3>{workspaceDoc?.title}</h3>
            <p>{formatBytes(workspaceDoc?.sizeBytes ?? 0)} • {workspaceDoc?.status}</p>
          </div>
          <div className="progress-block">
            <div className="progress-bar" aria-hidden="true">
              <span style={{ width: `${docProgress}%` }} />
            </div>
            <span>{docLoading ? `Streaming ${docProgress}%` : 'Ready for review'}</span>
          </div>
        </div>

        <div className="workspace-actions">
          {permissions.canSplit ? (
            <button
              type="button"
              className="primary"
              onClick={() => openSplitPreview()}
              disabled={docLoading}
              aria-label={`Split document for ${selectedClaim?.claimant ?? 'selected claim'}`}
            >
              Split
            </button>
          ) : null}
          {permissions.canMerge ? (
            <button
              type="button"
              className="secondary"
              onClick={() => openMergePreview()}
              disabled={docLoading || !canMergeNow}
              title={availablePackageCount < 2 ? 'Not enough document to merge' : ''}
              aria-label={`Merge document for ${selectedClaim?.claimant ?? 'selected claim'}`}
            >
              Merge
            </button>
          ) : null}
          {permissions.canEdit ? (
            <button
              type="button"
              className="secondary"
              onClick={() => openEditModal(selectedClaim)}
              aria-label={`Edit ${selectedClaim?.claimant ?? 'selected claim'}`}
            >
              Edit
            </button>
          ) : null}
          {permissions.canAssign && !isReviewer ? (
            <button
              type="button"
              className="secondary"
              onClick={() => openAssignModal(selectedClaim)}
              aria-label={`Assign ${selectedClaim?.claimant ?? 'selected claim'}`}
            >
              Assign
            </button>
          ) : null}
          {lastSplitBackup ? <button type="button" className="ghost" onClick={undoSplit}>Undo Split</button> : null}
          {lastMergeBackup ? <button type="button" className="ghost" onClick={undoMerge}>Undo Merge</button> : null}
          {operationState.status === 'running' ? (
            <button type="button" className="ghost" onClick={cancelOperation}>Cancel</button>
          ) : null}
          {lastError ? (
            <button type="button" className="ghost" onClick={() => handleOperation(operationState.label || 'split')}>Retry</button>
          ) : null}
        </div>

        {operationState.status !== 'idle' ? (
          <div className="operation-card">
            <div className="operation-head">
              <strong>{operationState.label ? `${operationState.label} in progress` : 'Operation'}</strong>
              <span>{operationState.progress}%</span>
            </div>
            <div className="progress-bar" aria-hidden="true">
              <span style={{ width: `${operationState.progress}%` }} />
            </div>
            {operationState.status === 'failed' ? <p className="error-text">{lastError}</p> : null}
          </div>
        ) : null}

        <div className="document-grid" onClick={handleDocumentGridClick}>
          {workspaceDoc?.packages?.length ? (
            <div className="workspace-sidebar">
              <div className="packages-panel">
                <div className="package-nav">
                  <strong>Documents</strong>
                  <div className="package-list">
                    {workspaceDoc.packages.map((pkg, idx) => (
                      <button
                        key={idx}
                        className={`package-pill ${idx === currentPackageIndex ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentPackageIndex(idx)
                          const first = pkg[0]?.id
                          if (first) setSelectedPage(first)
                        }}
                      >
                        {`Pkg ${idx + 1} (${pkg.length})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="workspace-main">
            <div className="page-list-panel">
              <h4>{selectedPageData ? `Page ${selectedPage}` : selectedClaim?.claimant ?? 'Claimant comments'}</h4>
              <p>
                {selectedPageData
                  ? 'Comments stay attached to the selected page even during long-running operations.'
                  : 'No page selected. Comments will be saved at claimant level.'}
              </p>

              <div className="page-list">
                {displayedPages.length ? (
                  displayedPages.map((page) => (
                    <button
                      type="button"
                      key={page.id}
                      className={`page-card ${selectedPage === page.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPage(selectedPage === page.id ? null : page.id)}
                    >
                      <strong>{page.label}</strong>
                      <span>{page.comments.length} comments</span>
                    </button>
                  ))
                ) : (
                  <p className="empty-state">No pages loaded yet.</p>
                )}
              </div>
            </div>

            <div className="detail-card">
              <div className="meta-block">
                <h5>Comments</h5>
                {visibleComments.length ? (
                  <ul>
                    {visibleComments.map((comment) => (
                      <li key={comment}>{comment}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No comments yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="meta-block">
              <h5>Claimant-level comments</h5>
              {claimantComments.length ? (
                <ul>
                  {claimantComments.map((comment, index) => (
                    <li key={`${comment}-${index}`}>{comment}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No claimant-level comments yet.</p>
              )}
            </div>
          </div>

          <div className="comment-box common-comment-box">
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder={selectedPageData ? 'Add a page-level comment' : 'Add a claimant-level comment'}
            />
            <div className="comment-actions">
              <button type="button" className="primary" onClick={handleAddComment}>Save comment</button>
            </div>
          </div>

          {isReviewer ? (
            <div className="page-list-actions review-actions">
              {permissions.canAssign ? (
                <button type="button" className="secondary" onClick={() => openAssignModal(selectedClaim)}>
                  Re-assign
                </button>
              ) : null}
              {permissions.canReview ? (
                <button type="button" className="primary" onClick={approveSelectedClaim}>
                  Approve
                </button>
              ) : null}
              {permissions.canReview ? (
                <button type="button" className="ghost danger" onClick={rejectSelectedClaim}>
                  Reject
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="architecture-card">
          <div>
            <p className="eyebrow">Architecture & trade-offs</p>
            <h3>Performance strategy</h3>
          </div>
          <ul>
            <li>Virtualized grid renders only the visible rows, avoiding DOM spikes for 20,000+ claims.</li>
            <li>Streaming document loading uses chunked progress and a worker-ready pattern for 500 MB+ files.</li>
            <li>RBAC is enforced in the backend as the source of truth, while the UI hides and disables actions for a smoother experience.</li>
            <li>Pessimistic updates keep the workspace state consistent after split, merge, and comment transitions.</li>
          </ul>
          <div className="feedback-pill">{feedback}</div>
          <div className="history-list">
            {workspaceDoc?.history.map((entry) => <span key={entry}>{entry}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(WorkspacePanel)
