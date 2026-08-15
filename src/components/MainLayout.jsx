import React from 'react'
import Topbar from './Topbar'
import SummaryGrid from './SummaryGrid'
import ClaimsTable from './ClaimsTable'
import WorkspacePanel from './WorkspacePanel'
import { ROLE_PERMISSIONS, STATUSES, formatBytes } from '../claimsData'

export default function MainLayout({
  role,
  handleRoleChange,
  permissions,
  user,
  handleLogout,
  setUserCreateModalOpen,
  filteredClaims,
  selectedClaim,
  workspaceDoc,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  handleSort,
  totalHeight,
  spacerTop,
  spacerBottom,
  visibleClaims,
  setSelectedClaimId,
  setScrollTop,
  claims,
  totalClaimsCount,
  loadingClaims,
  docProgress,
  docLoading,
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
  handleOpenDeleteModal,
  handleEditClick,
  handleDeleteClick,
  handleAssignClick,
}) {
  return (
    <div className="app-shell">
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
          loadMoreClaims={() => {}}
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