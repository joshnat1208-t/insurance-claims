import React, { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import Icons from './Icons'
import { ROLE_PERMISSIONS, STATUSES, buildClaims, formatBytes, createDocumentSnapshot } from './claimsData'
import Topbar from './components/Topbar'
import SummaryGrid from './components/SummaryGrid'
import ClaimsTable from './components/ClaimsTable'
import WorkspacePanel from './components/WorkspacePanel'
import ClaimModals from './components/ClaimModals'
import Login from './components/Login'
import UserCreateModal from './components/UserCreateModal'
import useClaimsTable from './hooks/useClaimsTable'
import useDocumentOperations from './hooks/useDocumentOperations'
import useClaimActions from './hooks/useClaimActions'
import usePageActions from './hooks/usePageActions'
import useOperationRunner from './hooks/useOperationRunner'
import useToast from './hooks/useToast'
import { claimsApi } from './api/claimsApi'

const TOTAL_CLAIMS = 20000

function App() {
  const [claims, setClaims] = useState(() => buildClaims(TOTAL_CLAIMS, 0))
  // Session / Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_data')
    return saved ? JSON.parse(saved) : null
  })

  // Modals & Claims States
  const [userCreateModalOpen, setUserCreateModalOpen] = useState(false)
  const [totalClaimsCount, setTotalClaimsCount] = useState(TOTAL_CLAIMS)
  const [loadingClaims, setLoadingClaims] = useState(false)

  // Sync initial role state with logged-in user or default to 'admin'
  const activeUserRole = user?.role || 'admin'
  const [role, setRole] = useState(activeUserRole)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortKey, setSortKey] = useState('claimant')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedClaimId, setSelectedClaimId] = useState(1000)
  const [scrollTop, setScrollTop] = useState(0)

  // Document Workspace State
  const [workspaceDoc, setWorkspaceDoc] = useState(() => createDocumentSnapshot(claims[0]))
  const [docLoading, setDocLoading] = useState(true)
  const [docProgress, setDocProgress] = useState(0)
  const [selectedPage, setSelectedPage] = useState(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [feedback, setFeedback] = useState('Virtualization keeps the grid responsive while the document workspace streams in the background.')
  const [lastError, setLastError] = useState('')
  const isFirstDocumentLoadRef = useRef(true)
  const { toastMessage, toastType, showToast } = useToast()

  // Keep active role synced with logged in user
  useEffect(() => {
    if (user?.role) {
      setRole(user.role)
    }
  }, [user])

  // ---------------------------------------------------------------------------
  // 2. FETCH CLAIMS FROM CLAIMSAPI (LOAD ONLY ONCE ON INIT)
  // ---------------------------------------------------------------------------
  const loadClaimsFromApi = useCallback(async () => {
    if (!isAuthenticated) return
    setLoadingClaims(true)
    try {
      const response = await claimsApi.fetchClaims({
        search: '',
        status: 'All',
        sortKey: 'claimant',
        sortDir: 'asc',
      })

      const dataList = response.data || []
      setClaims(dataList)
      setTotalClaimsCount(response.totalItems || dataList.length)

      if (dataList.length > 0 && !selectedClaimId) {
        setSelectedClaimId(dataList[0].id)
      }
    } catch (err) {
      // showToast(`Failed to fetch claims: ${err.message}`, 'error')
    } finally {
      setLoadingClaims(false)
    }
  }, [isAuthenticated, showToast])

  useEffect(() => {
    loadClaimsFromApi()
  }, [isAuthenticated])

  // ---------------------------------------------------------------------------
  // 3. AUTH & USER CREATION HANDLERS
  // ---------------------------------------------------------------------------
  const handleRoleChange = useCallback((nextRole) => {
    setRole(nextRole)
    setStatusFilter(nextRole === 'reviewer' ? 'In Review' : 'All')
  }, [])

  const handleLogin = useCallback(async ({ email, password, role: selectedRole }) => {
    const normalizedEmail = (email || 'admin@abc.com').trim().toLowerCase()

    let derivedRole = selectedRole
    if (!derivedRole) {
      if (normalizedEmail.includes('adjuster')) {
        derivedRole = 'adjuster'
      } else if (normalizedEmail.includes('reviewer')) {
        derivedRole = 'reviewer'
      } else {
        derivedRole = 'admin'
      }
    }

    const rawUsername = normalizedEmail.includes('@') ? normalizedEmail.split('@')[0] : 'User'
    const username = rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1)

    const fallbackUser = {
      id: `u_${Date.now()}`,
      username,
      email: normalizedEmail,
      role: derivedRole,
    }

    try {
      const response = await claimsApi.login(normalizedEmail, password)
      const userData = response?.user || fallbackUser
      const token = response?.token || 'dummy-fallback-token'

      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(userData))
      setUser(userData)
      setRole(userData.role)
    } catch (err) {
      console.warn('Login API failed, proceeding with derived fallback session:', err)

      localStorage.setItem('auth_token', 'dummy-fallback-token')
      localStorage.setItem('user_data', JSON.stringify(fallbackUser))
      setUser(fallbackUser)
      setRole(fallbackUser.role)
    } finally {
      setIsAuthenticated(true)
    }
  }, [])

const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setIsAuthenticated(false)
    setUser(null)
    setRole('adjuster') // Reset role to default state
  }, [])

  const handleCreateUser = useCallback(async (newUser) => {
    try {
      const createdUser = await claimsApi.createUser(newUser)
      setFeedback(`New user ${createdUser.username} created with role ${createdUser.role}.`)
      showToast(`User ${createdUser.username} created successfully!`, 'success')
      setUserCreateModalOpen(false)
    } catch (err) {
      showToast(`Failed to create user: ${err.message}`, 'error')
    }
  }, [showToast])

  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.admin
  const assignActionLabel = permissions?.label === 'Reviewer' ? 'Re-assign' : 'Assign'
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

  // ---------------------------------------------------------------------------
  // 4. FETCH WORKSPACE DOCUMENT SNAPSHOT FROM API
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedClaim || !isAuthenticated) return

    setSelectedClaimId(selectedClaim.id)
    setSelectedPage(null)
    setFeedback(`Streaming ${selectedClaim.claimant}'s document set...`)

    let isSubscribed = true
    setDocLoading(true)
    setDocProgress(0)

    claimsApi.fetchDocumentSnapshot(selectedClaim.id)
      .then((snapshot) => {
        if (!isSubscribed) return
        setWorkspaceDoc(snapshot)
        setDocProgress(100)
        setDocLoading(false)
      })
      .catch((err) => {
        if (isSubscribed) {
          setDocLoading(false)
        }
      })

    return () => {
      isSubscribed = false
    }
  }, [selectedClaim?.id, isAuthenticated])

  useEffect(() => {
    if (!filteredClaims.length) return
    if (!filteredClaims.some((claim) => claim.id === selectedClaimId)) {
      setSelectedClaimId(filteredClaims[0].id)
    }
  }, [filteredClaims, selectedClaimId])

  const loadMoreClaims = useCallback(() => {}, [])

  // Hook Operations
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
    handleOpenDeleteModal,
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

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} roleOptions={Object.entries(ROLE_PERMISSIONS)} />
  }

  return (
    <div className="app-shell">
      <Icons />
      {toastMessage ? (
        <div className={`toast ${toastType}`} role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}

      <UserCreateModal
        isOpen={userCreateModalOpen}
        onClose={() => setUserCreateModalOpen(false)}
        onCreateUser={handleCreateUser}
        roleOptions={Object.entries(ROLE_PERMISSIONS)}
      />

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
        user={user}
        onLogout={handleLogout}
        onOpenCreateUser={() => setUserCreateModalOpen(true)}
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
          loadedClaimCount={claims.length}
          totalClaims={totalClaimsCount || claims.length}
          permissions={permissions}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          handleAssignClick={handleAssignClick}
          loading={loadingClaims}
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
          openDeleteModal={handleOpenDeleteModal}
        />
      </main>
    </div>
  )
}

export default App