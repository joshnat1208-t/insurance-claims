import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import useClaimActions from './useClaimActions'
import { createClaims, createWorkspaceDoc } from '../test/fixtures'

function renderClaimActions(options = {}) {
  const setLastError = vi.fn()
  const showToast = vi.fn()
  const setFeedback = vi.fn()

  const { result } = renderHook(() => {
    const [claims, setClaims] = useState(options.claims ?? createClaims(4))
    const [selectedClaimId, setSelectedClaimId] = useState(options.selectedClaimId ?? claims[0].id)
    const [workspaceDoc, setWorkspaceDoc] = useState(options.workspaceDoc ?? createWorkspaceDoc())

    const hook = useClaimActions({
      claims,
      setClaims,
      filteredClaims: claims,
      selectedClaimId,
      setSelectedClaimId,
      permissions: options.permissions ?? { canEdit: true, canAssign: true, canDelete: true, canReview: true },
      setLastError,
      showToast,
      setWorkspaceDoc,
      setFeedback,
    })

    return { ...hook, claims, selectedClaimId, workspaceDoc }
  })

  return { result, setLastError, showToast, setFeedback }
}

describe('useClaimActions', () => {
  it('blocks edit for roles without permission', () => {
    const { result, setLastError, showToast } = renderClaimActions({ permissions: { canEdit: false, canAssign: true, canDelete: true, canReview: true } })

    act(() => result.current.openEditModal(result.current.claims[0]))

    expect(setLastError).toHaveBeenCalledWith('This role cannot edit documents.')
    expect(showToast).toHaveBeenCalledWith('This role cannot edit documents.', 'error')
  })

  it('edits the selected claim and refreshes the workspace title', () => {
    const { result, showToast, setFeedback } = renderClaimActions()

    act(() => result.current.openEditModal(result.current.claims[0]))
    act(() => result.current.setEditDraft((current) => ({ ...current, claimant: 'Updated Claimant' })))
    act(() => result.current.saveEdit())

    expect(result.current.claims[0].claimant).toBe('Updated Claimant')
    expect(result.current.workspaceDoc.title).toBe('Updated Claimant packet')
    expect(showToast).toHaveBeenCalledWith('Changes saved.', 'success')
    expect(setFeedback).toHaveBeenCalledWith('Saved changes for Updated Claimant.')
  })

  it('assigns claims and appends history for the selected record', () => {
    const { result, showToast, setFeedback } = renderClaimActions()

    act(() => result.current.openAssignModal(result.current.claims[0]))
    act(() => result.current.setAssignDraft({ id: result.current.claims[0].id, assignee: 'T. Miller' }))
    act(() => result.current.saveAssign())

    expect(result.current.claims[0].assignee).toBe('T. Miller')
    expect(result.current.workspaceDoc.history).toContain('Assigned to T. Miller')
    expect(showToast).toHaveBeenCalledWith('Assignment saved.', 'success')
    expect(setFeedback).toHaveBeenCalledWith('Assigned to T. Miller.')
  })

  it('deletes claims through the row action handler', () => {
    const { result, showToast } = renderClaimActions()

    act(() => result.current.handleDeleteClick({ currentTarget: { dataset: { id: String(result.current.claims[0].id) } } }))

    expect(result.current.claims).toHaveLength(3)
    expect(showToast).toHaveBeenCalledWith('Claim deleted successfully.', 'success')
  })

  it('approves and rejects the selected claim for review roles', () => {
    const { result, showToast, setFeedback } = renderClaimActions()

    act(() => result.current.approveSelectedClaim())
    expect(result.current.claims[0].status).toBe('Approved')
    expect(showToast).toHaveBeenCalledWith('Claim approved.', 'success')
    expect(setFeedback).toHaveBeenCalledWith('Claimant 1 marked as Approved.')

    act(() => result.current.rejectSelectedClaim())
    expect(result.current.claims[0].status).toBe('Rejected')
    expect(showToast).toHaveBeenCalledWith('Claim rejected.', 'success')
  })

  it('validates edit and assign drafts and blocks assignment without permission', () => {
    const blocked = renderClaimActions({ permissions: { canEdit: true, canAssign: false, canDelete: true, canReview: false } })
    act(() => blocked.result.current.openAssignModal(blocked.result.current.claims[0]))
    expect(blocked.setLastError).toHaveBeenCalledWith('Assignment is unavailable for this role.')

    act(() => blocked.result.current.approveSelectedClaim())
    expect(blocked.setLastError).toHaveBeenCalledWith('Review actions are unavailable for this role.')

    const editable = renderClaimActions()
    act(() => editable.result.current.openEditModal(editable.result.current.claims[0]))
    act(() => editable.result.current.setEditDraft((current) => ({ ...current, claimant: '   ' })))
    act(() => editable.result.current.saveEdit())
    expect(editable.showToast).toHaveBeenCalledWith('Claimant name is required.', 'error')

    act(() => editable.result.current.openAssignModal(editable.result.current.claims[0]))
    act(() => editable.result.current.setAssignDraft({ id: editable.result.current.claims[0].id, assignee: '   ' }))
    act(() => editable.result.current.saveAssign())
    expect(editable.showToast).toHaveBeenCalledWith('Select an assignee.', 'error')
  })
})