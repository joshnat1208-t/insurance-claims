import React from 'react'
import UserCreateModal from './UserCreateModal'
import ClaimModals from './ClaimModals'
import { ROLE_PERMISSIONS } from '../claimsData'

export default function AppModals({
  userCreateModalOpen,
  setUserCreateModalOpen,
  handleCreateUser,
  editModalOpen,
  editDraft,
  closeEditModal,
  saveEdit,
  setEditDraft,
  assignModalOpen,
  assignDraft,
  closeAssignModal,
  saveAssign,
  setAssignDraft,
  assignActionLabel,
  claims,
  splitModalOpen,
  setSplitModalOpen,
  splitSize,
  setSplitSize,
  splitPreview,
  confirmSplit,
  mergeModalOpen,
  setMergeModalOpen,
  mergePreview,
  mergeSelection,
  toggleMergeSelection,
  confirmMerge,
}) {
  return (
    <>
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
    </>
  )
}