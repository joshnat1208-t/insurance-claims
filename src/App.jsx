import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import Icons from './Icons'
import { ROLE_PERMISSIONS, buildClaims, createDocumentSnapshot } from './claimsData'
import AuthManager from './components/AuthManager'
import AppModals from './components/AppModals'
import MainLayout from './components/MainLayout'
import useClaimsTable from './hooks/useClaimsTable'
import useDocumentOperations from './hooks/useDocumentOperations'
import useClaimActions from './hooks/useClaimActions'
import usePageActions from './hooks/usePageActions'
import useOperationRunner from './hooks/useOperationRunner'
import useToast from './hooks/useToast'
import { AuthLogin } from './api/AuthLogin'
import { claimsApi } from './api/claimsApi'

const TOTAL_CLAIMS = 20000

function App() {
  const [claims, setClaims] = useState(() => buildClaims(TOTAL_CLAIMS, 0))
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_data')
    return saved ? JSON.parse(saved) : null
  })

  const [userCreateModalOpen, setUserCreateModalOpen] = useState(false)
  const [totalClaimsCount, setTotalClaimsCount] = useState(TOTAL_CLAIMS)
  const [loadingClaims, setLoadingClaims] = useState(false)

  const activeUserRole = user?.role || 'admin'
  const [role, setRole] = useState(activeUserRole)
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
  const [feedback, setFeedback] = useState('Virtualization keeps the grid responsive...')
  const [lastError, setLastError] = useState('')
  const { toastMessage, toastType, showToast } = useToast()

  // Sync user role
  useEffect(() => {
    if (user?.role) setRole(user.role)
  }, [user])

// Inside App component:
const loadClaimsFromApi = useCallback(async () => {
  if (!isAuthenticated) return
  const token = localStorage.getItem('auth_token')

  setLoadingClaims(true)
  try {
    const response = await claimsApi.fetchClaims({
      search,
      status: statusFilter,
      sortKey,
      sortDir,
      token,
    })
    const dataList = response.data || []
    setClaims(dataList)
    setTotalClaimsCount(response.totalItems || dataList.length)

    if (dataList.length > 0 && !selectedClaimId) {
      setSelectedClaimId(dataList[0].id)
    }
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      handleLogout()
    }
  } finally {
    setLoadingClaims(false)
  }
}, [isAuthenticated, search, statusFilter, sortKey, sortDir, selectedClaimId])

  useEffect(() => {
    loadClaimsFromApi()
  }, [isAuthenticated, loadClaimsFromApi])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setIsAuthenticated(false)
    setUser(null)
    setRole('adjuster')
  }, [])

  const handleRoleChange = useCallback((nextRole) => {
    setRole(nextRole)
    setStatusFilter(nextRole === 'reviewer' ? 'In Review' : 'All')
  }, [])

  const handleCreateUser = useCallback(async (newUser) => {
    try {
      const createdUser = await AuthLogin.createUser(newUser)
      setFeedback(`New user ${createdUser.username} created with role ${createdUser.role}.`)
      showToast(`User ${createdUser.username} created successfully!`, 'success')
      setUserCreateModalOpen(false)
    } catch (err) {
      showToast(`Failed to create user: ${err.message}`, 'error')
    }
  }, [showToast])

  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.admin
  const assignActionLabel = permissions?.label === 'Reviewer' ? 'Re-assign' : 'Assign'

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
    rowHeight: 61,
    viewportHeight: 520,
    setSortKey,
    setSortDir,
  })

  useEffect(() => {
    if (!selectedClaim || !isAuthenticated) return

    setSelectedClaimId(selectedClaim.id)
    setSelectedPage(null)
    setFeedback(`Streaming ${selectedClaim.claimant}'s document set...`)

    let isSubscribed = true
    setDocLoading(true)
    setDocProgress(0)

    return () => { isSubscribed = false }
  }, [selectedClaim?.id, isAuthenticated])

  useEffect(() => {
    if (!filteredClaims.length) return
    if (!filteredClaims.some((claim) => claim.id === selectedClaimId)) {
      setSelectedClaimId(filteredClaims[0].id)
    }
  }, [filteredClaims, selectedClaimId])

  // Custom Hooks
  const { operationState, setOperationState, handleOperation, cancelOperation } = useOperationRunner({
    permissions, selectedClaim, workspaceDoc, setWorkspaceDoc, setFeedback, setLastError,
  })

  const {
    splitModalOpen, setSplitModalOpen, splitSize, setSplitSize, splitPreview, lastSplitBackup,
    mergeModalOpen, setMergeModalOpen, mergePreview, mergeSelection, lastMergeBackup,
    currentPackageIndex, setCurrentPackageIndex, availablePackageCount, canMergeNow,
    openSplitPreview, confirmSplit, undoSplit, openMergePreview, toggleMergeSelection,
    confirmMerge, undoMerge,
  } = useDocumentOperations({
    permissions, workspaceDoc, setWorkspaceDoc, setFeedback, setLastError, showToast, setOperationState,
  })

  const {
    editModalOpen, editDraft, setEditDraft, assignModalOpen, assignDraft, setAssignDraft,
    openEditModal, closeEditModal, saveEdit, openAssignModal, closeAssignModal, saveAssign,
    handleEditClick, handleDeleteClick, handleAssignClick, approveSelectedClaim, rejectSelectedClaim,
  } = useClaimActions({
    claims, setClaims, filteredClaims, selectedClaimId, setSelectedClaimId, permissions,
    setLastError, showToast, setWorkspaceDoc, setFeedback,
  })

  const { handlePageDelete, handleAddComment, handleOpenDeleteModal, selectedPageData } = usePageActions({
    permissions, selectedPage, setSelectedPage, workspaceDoc, setWorkspaceDoc,
    commentDraft, setCommentDraft, setLastError, setFeedback, showToast,
  })

  return (
    <AuthManager
      user={user}
      setUser={setUser}
      setRole={setRole}
      isAuthenticated={isAuthenticated}
      setIsAuthenticated={setIsAuthenticated}
      showToast={showToast}
    >
      <Icons />
      {toastMessage && (
        <div className={`toast ${toastType}`} role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <AppModals
        userCreateModalOpen={userCreateModalOpen}
        setUserCreateModalOpen={setUserCreateModalOpen}
        handleCreateUser={handleCreateUser}
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

      <MainLayout
        role={role}
        handleRoleChange={handleRoleChange}
        permissions={permissions}
        user={user}
        handleLogout={handleLogout}
        setUserCreateModalOpen={setUserCreateModalOpen}
        filteredClaims={filteredClaims}
        selectedClaim={selectedClaim}
        workspaceDoc={workspaceDoc}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        handleSort={handleSort}
        totalHeight={totalHeight}
        spacerTop={spacerTop}
        spacerBottom={spacerBottom}
        visibleClaims={visibleClaims}
        setSelectedClaimId={setSelectedClaimId}
        setScrollTop={setScrollTop}
        claims={claims}
        totalClaimsCount={totalClaimsCount}
        loadingClaims={loadingClaims}
        docProgress={docProgress}
        docLoading={docLoading}
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
        handleOpenDeleteModal={handleOpenDeleteModal}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        handleAssignClick={handleAssignClick}
      />
    </AuthManager>
  )
}

export default App