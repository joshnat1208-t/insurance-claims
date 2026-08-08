import { useCallback, useState } from 'react'

export default function useClaimActions({
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
}) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editDraft, setEditDraft] = useState(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignDraft, setAssignDraft] = useState(null)

  const openEditModal = useCallback((claim) => {
    const target = claim || filteredClaims.find((c) => c.id === selectedClaimId) || claims[0]
    if (!target) return

    if (!permissions.canEdit) {
      setLastError('This role cannot edit documents.')
      showToast('This role cannot edit documents.', 'error')
      return
    }

    setSelectedClaimId(target.id)
    setEditDraft({
      id: target.id,
      claimant: target.claimant,
      policy: target.policy,
      assignee: target.assignee,
      status: target.status,
    })
    setEditModalOpen(true)
  }, [filteredClaims, selectedClaimId, claims, permissions.canEdit, setLastError, showToast, setSelectedClaimId])

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false)
    setEditDraft(null)
  }, [])

  const saveEdit = useCallback(() => {
    if (!editDraft) return
    if (!editDraft.claimant || !editDraft.claimant.trim()) {
      showToast('Claimant name is required.', 'error')
      return
    }

    setClaims((current) => current.map((c) => (c.id === editDraft.id ? { ...c, ...editDraft } : c)))
    if (selectedClaimId === editDraft.id) {
      setWorkspaceDoc((current) => ({ ...current, title: `${editDraft.claimant} packet` }))
    }

    setFeedback(`Saved changes for ${editDraft.claimant}.`)
    showToast('Changes saved.', 'success')
    setEditModalOpen(false)
    setEditDraft(null)
  }, [editDraft, showToast, setClaims, selectedClaimId, setWorkspaceDoc, setFeedback])

  const openAssignModal = useCallback((claim) => {
    const target = claim || filteredClaims.find((c) => c.id === selectedClaimId) || claims[0]
    if (!target) return

    if (!permissions.canAssign) {
      setLastError('Assignment is unavailable for this role.')
      showToast('Assignment is unavailable for this role.', 'error')
      return
    }

    setSelectedClaimId(target.id)
    setAssignDraft({ id: target.id, assignee: target.assignee })
    setAssignModalOpen(true)
  }, [filteredClaims, selectedClaimId, claims, permissions.canAssign, setLastError, showToast, setSelectedClaimId])

  const closeAssignModal = useCallback(() => {
    setAssignModalOpen(false)
    setAssignDraft(null)
  }, [])

  const saveAssign = useCallback(() => {
    if (!assignDraft) return
    if (!assignDraft.assignee || !assignDraft.assignee.trim()) {
      showToast('Select an assignee.', 'error')
      return
    }

    setClaims((current) => current.map((c) => (c.id === assignDraft.id ? { ...c, assignee: assignDraft.assignee } : c)))
    if (selectedClaimId === assignDraft.id) {
      setWorkspaceDoc((current) => ({ ...current, history: [...current.history, `Assigned to ${assignDraft.assignee}`] }))
    }

    setFeedback(`Assigned to ${assignDraft.assignee}.`)
    showToast('Assignment saved.', 'success')
    setAssignModalOpen(false)
    setAssignDraft(null)
  }, [assignDraft, showToast, setClaims, selectedClaimId, setWorkspaceDoc, setFeedback])

  const handleClaimDelete = useCallback((claim) => {
    if (!claim) return

    setSelectedClaimId(claim.id)
    if (!permissions.canDelete) {
      setLastError('Delete is blocked for this role.')
      showToast('Delete is blocked for this role.', 'error')
      return
    }

    setClaims((currentClaims) => currentClaims.filter((item) => item.id !== claim.id))
    setFeedback('Deleted a draft note from the selected evidence bundle.')
    showToast('Claim deleted successfully.', 'success')
  }, [setSelectedClaimId, permissions.canDelete, setLastError, showToast, setClaims, setFeedback])

  const handleEditClick = useCallback((e) => {
    const id = Number(e.currentTarget.dataset.id)
    const claim = claims.find((c) => c.id === id)
    if (claim) openEditModal(claim)
  }, [claims, openEditModal])

  const handleDeleteClick = useCallback((e) => {
    const id = Number(e.currentTarget.dataset.id)
    const claim = claims.find((c) => c.id === id)
    if (claim) handleClaimDelete(claim)
  }, [claims, handleClaimDelete])

  const handleAssignClick = useCallback((e) => {
    const id = Number(e.currentTarget.dataset.id)
    const claim = claims.find((c) => c.id === id)
    if (claim) openAssignModal(claim)
  }, [claims, openAssignModal])

  const updateClaimStatus = useCallback((nextStatus) => {
    const target = filteredClaims.find((claim) => claim.id === selectedClaimId) || claims.find((claim) => claim.id === selectedClaimId) || claims[0]
    if (!target) return

    if (!permissions.canReview) {
      setLastError('Review actions are unavailable for this role.')
      showToast('Review actions are unavailable for this role.', 'error')
      return
    }

    setClaims((current) => current.map((claim) => (claim.id === target.id ? { ...claim, status: nextStatus } : claim)))
    if (selectedClaimId === target.id) {
      setWorkspaceDoc((current) => ({
        ...current,
        history: [...current.history, `${nextStatus} by ${target.assignee}`],
      }))
    }

    setFeedback(`${target.claimant} marked as ${nextStatus}.`)
    showToast(`Claim ${nextStatus.toLowerCase()}.`, 'success')
  }, [claims, filteredClaims, permissions.canReview, selectedClaimId, setClaims, setFeedback, setLastError, setWorkspaceDoc, showToast])

  const approveSelectedClaim = useCallback(() => {
    updateClaimStatus('Approved')
  }, [updateClaimStatus])

  const rejectSelectedClaim = useCallback(() => {
    updateClaimStatus('Rejected')
  }, [updateClaimStatus])

  return {
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
  }
}