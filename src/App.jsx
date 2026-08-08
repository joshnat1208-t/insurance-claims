import React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import Icons from './Icons'
import { ROLE_PERMISSIONS, STATUSES, buildClaims, formatBytes, createDocumentSnapshot } from './claimsData'
import Topbar from './components/Topbar'
import SummaryGrid from './components/SummaryGrid'
import ClaimsTable from './components/ClaimsTable'
import WorkspacePanel from './components/WorkspacePanel'
import ClaimModals from './components/ClaimModals'
import useClaimsTable from './hooks/useClaimsTable'
import useDocumentOperations from './hooks/useDocumentOperations'
import useClaimActions from './hooks/useClaimActions'
import usePageActions from './hooks/usePageActions'
import useOperationRunner from './hooks/useOperationRunner'
import useToast from './hooks/useToast'

const TOTAL_CLAIMS = 20000
function App() {
  const [claims, setClaims] = useState(() => buildClaims(TOTAL_CLAIMS, 0))
  const [role, setRole] = useState('adjuster')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortKey, setSortKey] = useState('claimant')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedClaimId, setSelectedClaimId] = useState(1000)
  const [scrollTop, setScrollTop] = useState(0)
  const [workspaceDoc, setWorkspaceDoc] = useState(() => createDocumentSnapshot(claims[0]))
  const [docLoading, setDocLoading] = useState(true)
  const [docProgress, setDocProgress] = useState(0)
  const [selectedPage, setSelectedPage] = useState(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [feedback, setFeedback] = useState('Virtualization keeps the grid responsive while the document workspace streams in the background.')
  const [lastError, setLastError] = useState('')
  const isFirstDocumentLoadRef = useRef(true)
  const { toastMessage, toastType, showToast } = useToast()

  const handleRoleChange = useCallback((nextRole) => {
    setRole(nextRole)
    setStatusFilter(nextRole === 'reviewer' ? 'In Review' : 'All')
  }, [])

  const permissions = ROLE_PERMISSIONS[role]
  const assignActionLabel = permissions.label === 'Reviewer' ? 'Re-assign' : 'Assign'
  const rowHeight = 61
  const viewportHeight = 520

  const {
    filteredClaims,
    selectedClaim,
    visibleClaims,
    totalHeight,
    spacerTop,
    spacerBottom,
    handleSort,
  } = useClaimsTable({
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
  })

  useEffect(() => {
    if (!selectedClaim) return
    setSelectedClaimId(selectedClaim.id)
    setSelectedPage(null)
    setFeedback(`Streaming ${selectedClaim.claimant}'s document set into the workspace.`)

    const nextSnapshot = createDocumentSnapshot(selectedClaim)
    setWorkspaceDoc(nextSnapshot)

    if (isFirstDocumentLoadRef.current) {
      // Avoid initial progress animation during startup; it causes extra main-thread work.
      isFirstDocumentLoadRef.current = false
      setDocLoading(false)
      setDocProgress(100)
      return undefined
    }

    setDocLoading(true)
    setDocProgress(0)
    const timer = window.setInterval(() => {
      setDocProgress((current) => {
        const next = current + 10
        if (next >= 100) {
          window.clearInterval(timer)
          setDocLoading(false)
          return 100
        }
        return next
      })
    }, 140)

    return () => window.clearInterval(timer)
  }, [selectedClaim])

  useEffect(() => {
    if (!filteredClaims.length) return
    if (!filteredClaims.some((claim) => claim.id === selectedClaimId)) {
      setSelectedClaimId(filteredClaims[0].id)
    }
  }, [filteredClaims, selectedClaimId])

  const loadMoreClaims = useCallback(() => {}, [])

  const {
    operationState,
    setOperationState,
    handleOperation,
    cancelOperation,
  } = useOperationRunner({
    permissions,
    selectedClaim,
    workspaceDoc,
    setWorkspaceDoc,
    setFeedback,
    setLastError,
  })

  const {
    splitModalOpen,
    setSplitModalOpen,
    splitSize,
    setSplitSize,
    splitPreview,
    lastSplitBackup,
    mergeModalOpen,
    setMergeModalOpen,
    mergePreview,
    mergeSelection,
    lastMergeBackup,
    currentPackageIndex,
    setCurrentPackageIndex,
    availablePackageCount,
    canMergeNow,
    openSplitPreview,
    confirmSplit,
    undoSplit,
    openMergePreview,
    toggleMergeSelection,
    confirmMerge,
    undoMerge,
  } = useDocumentOperations({
    permissions,
    workspaceDoc,
    setWorkspaceDoc,
    setFeedback,
    setLastError,
    showToast,
    setOperationState,
  })

  const {
    editModalOpen,
    editDraft,
    setEditDraft,
    assignModalOpen,
    assignDraft,
    setAssignDraft,
    openEditModal,
    closeEditModal,
    saveEdit,
    openAssignModal,
    closeAssignModal,
    saveAssign,
    handleEditClick,
    handleDeleteClick,
    handleAssignClick,
    approveSelectedClaim,
    rejectSelectedClaim,
  } = useClaimActions({
    claims,
    setClaims,
    filteredClaims,
    selectedClaimId,
    setSelectedClaimId,
    permissions,
    setLastError,
    showToast,
    setWorkspaceDoc,
    setFeedback,
  })

  const {
    handlePageDelete,
    handleAddComment,
    selectedPageData,
  } = usePageActions({
    permissions,
    selectedPage,
    setSelectedPage,
    workspaceDoc,
    setWorkspaceDoc,
    commentDraft,
    setCommentDraft,
    setLastError,
    setFeedback,
    showToast,
  })

  return (
    <div className="app-shell">
      <Icons />
      {toastMessage ? (
        <div className={`toast ${toastType}`} role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}

      <ClaimModals
        editModalOpen={editModalOpen}
        editDraft={editDraft}
        closeEditModal={closeEditModal}
        saveEdit={saveEdit}
        setEditDraft={setEditDraft}
        assignModalOpen={assignModalOpen}
        assignDraft={assignDraft}
        closeAssignModal={closeAssignModal}
        saveAssign={saveAssign}
        setAssignDraft={setAssignDraft}
        assignActionLabel={assignActionLabel}
        claims={claims}
        splitModalOpen={splitModalOpen}
        setSplitModalOpen={setSplitModalOpen}
        splitSize={splitSize}
        setSplitSize={setSplitSize}
        splitPreview={splitPreview}
        confirmSplit={confirmSplit}
        mergeModalOpen={mergeModalOpen}
        setMergeModalOpen={setMergeModalOpen}
        mergePreview={mergePreview}
        mergeSelection={mergeSelection}
        toggleMergeSelection={toggleMergeSelection}
        confirmMerge={confirmMerge}
      />

      <Topbar
        role={role}
        setRole={handleRoleChange}
        permissions={permissions}
        roleOptions={Object.entries(ROLE_PERMISSIONS)}
      />

      <SummaryGrid
        filteredClaims={filteredClaims}
        selectedClaim={selectedClaim}
        workspaceDoc={workspaceDoc}
        formatBytes={formatBytes}
      />

      <main className="main-grid">
        <ClaimsTable
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statuses={STATUSES}
          handleSort={handleSort}
          totalHeight={totalHeight}
          spacerTop={spacerTop}
          spacerBottom={spacerBottom}
          visibleClaims={visibleClaims}
          selectedClaim={selectedClaim}
          setSelectedClaimId={setSelectedClaimId}
          setScrollTop={setScrollTop}
          loadMoreClaims={loadMoreClaims}
          loadedClaimCount={TOTAL_CLAIMS}
          totalClaims={TOTAL_CLAIMS}
          permissions={permissions}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          handleAssignClick={handleAssignClick}
        />

        <WorkspacePanel
          selectedClaim={selectedClaim}
          workspaceDoc={workspaceDoc}
          formatBytes={formatBytes}
          docProgress={docProgress}
          docLoading={docLoading}
          permissions={permissions}
          openSplitPreview={openSplitPreview}
          openMergePreview={openMergePreview}
          canMergeNow={canMergeNow}
          availablePackageCount={availablePackageCount}
          handlePageDelete={handlePageDelete}
          openEditModal={openEditModal}
          openAssignModal={openAssignModal}
          approveSelectedClaim={approveSelectedClaim}
          rejectSelectedClaim={rejectSelectedClaim}
          lastSplitBackup={lastSplitBackup}
          undoSplit={undoSplit}
          lastMergeBackup={lastMergeBackup}
          undoMerge={undoMerge}
          operationState={operationState}
          cancelOperation={cancelOperation}
          lastError={lastError}
          handleOperation={handleOperation}
          currentPackageIndex={currentPackageIndex}
          setCurrentPackageIndex={setCurrentPackageIndex}
          setSelectedPage={setSelectedPage}
          selectedPage={selectedPage}
          selectedPageData={selectedPageData}
          commentDraft={commentDraft}
          setCommentDraft={setCommentDraft}
          handleAddComment={handleAddComment}
          feedback={feedback}
        />
      </main>
    </div>
  )
}

export default App
