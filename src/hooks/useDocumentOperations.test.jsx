import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import useDocumentOperations from './useDocumentOperations'
import { createWorkspaceDoc } from '../test/fixtures'

function renderDocumentOperations(options = {}) {
  const showToast = vi.fn()
  const setFeedback = vi.fn()
  const setLastError = vi.fn()

  const { result } = renderHook(() => {
    const [workspaceDoc, setWorkspaceDoc] = useState(options.workspaceDoc ?? createWorkspaceDoc())
    const [operationState, setOperationState] = useState({ status: 'idle', label: '', progress: 0 })

    const hook = useDocumentOperations({
      permissions: options.permissions ?? { canSplit: true, canMerge: true },
      workspaceDoc,
      setWorkspaceDoc,
      setFeedback,
      setLastError,
      showToast,
      setOperationState,
    })

    return { ...hook, workspaceDoc, operationState }
  })

  return { result, showToast, setFeedback, setLastError }
}

describe('useDocumentOperations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
  })

  it('blocks split and merge without permission', () => {
    const { result, showToast, setLastError } = renderDocumentOperations({ permissions: { canSplit: false, canMerge: false } })

    act(() => result.current.openSplitPreview())
    expect(setLastError).toHaveBeenCalledWith('Split is unavailable for this role.')
    expect(showToast).toHaveBeenCalledWith('Split is unavailable for this role.', 'error')

    act(() => result.current.openMergePreview())
    expect(setLastError).toHaveBeenCalledWith('Merge is unavailable for this role.')
    expect(showToast).toHaveBeenCalledWith('Merge is unavailable for this role.', 'error')
  })

  it('splits documents, stores backups, and supports undo', () => {
    const { result, showToast, setFeedback } = renderDocumentOperations()

    act(() => result.current.setSplitSize(2))
    act(() => result.current.openSplitPreview())

    expect(result.current.splitModalOpen).toBe(true)
    expect(result.current.splitPreview).toHaveLength(2)

    act(() => result.current.confirmSplit())
    expect(result.current.workspaceDoc.packages).toHaveLength(2)
    expect(result.current.operationState).toMatchObject({ status: 'done', label: 'split', progress: 100 })
    expect(setFeedback).toHaveBeenCalledWith('Split into 2 packages.')
    expect(showToast).toHaveBeenCalledWith('Split into 2 packages.', 'success')

    act(() => vi.advanceTimersByTime(1200))
    expect(result.current.operationState.status).toBe('idle')

    act(() => result.current.undoSplit())
    expect(result.current.workspaceDoc.packages).toBeUndefined()
    expect(showToast).toHaveBeenCalledWith('Split undone.', 'info')
  })

  it('merges selected packages and keeps remaining packages', () => {
    const { result, showToast, setFeedback } = renderDocumentOperations({
      workspaceDoc: createWorkspaceDoc({
        packages: [
          [{ id: 1, label: 'Page 1', comments: [] }],
          [{ id: 2, label: 'Page 2', comments: [] }],
          [{ id: 3, label: 'Page 3', comments: [] }],
        ],
        pages: [{ id: 1, label: 'Page 1', comments: [] }],
      }),
    })

    act(() => result.current.openMergePreview())
    expect(result.current.mergeModalOpen).toBe(true)
    expect(result.current.availablePackageCount).toBe(3)
    expect(result.current.canMergeNow).toBe(true)

    act(() => result.current.confirmMerge())
    expect(showToast).toHaveBeenCalledWith('Select at least two packages to merge.', 'error')

    act(() => result.current.toggleMergeSelection(0))
    act(() => result.current.toggleMergeSelection(1))
    act(() => result.current.confirmMerge())

    expect(result.current.workspaceDoc.pages).toHaveLength(2)
    expect(result.current.workspaceDoc.packages).toHaveLength(1)
    expect(setFeedback).toHaveBeenCalledWith('Merged 2 packages into one.')
    expect(showToast).toHaveBeenCalledWith('Merged 2 packages.', 'success')

    act(() => result.current.undoMerge())
    expect(result.current.workspaceDoc.packages).toHaveLength(3)
  })
})