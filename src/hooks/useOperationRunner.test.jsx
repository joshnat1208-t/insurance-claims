import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import useOperationRunner from './useOperationRunner'
import { createWorkspaceDoc } from '../test/fixtures'

function renderOperationRunner(options = {}) {
  const setFeedback = vi.fn()
  const setLastError = vi.fn()

  const { result } = renderHook(() => {
    const [workspaceDoc, setWorkspaceDoc] = useState(options.workspaceDoc ?? createWorkspaceDoc())

    const hook = useOperationRunner({
      permissions: options.permissions ?? { canSplit: true, canMerge: true },
      selectedClaim: options.selectedClaim ?? { id: 1001, claimant: 'Claimant 2' },
      workspaceDoc,
      setWorkspaceDoc,
      setFeedback,
      setLastError,
    })

    return { ...hook, workspaceDoc }
  })

  return { result, setFeedback, setLastError }
}

describe('useOperationRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
  })

  it('blocks disallowed operations immediately', () => {
    const { result, setLastError } = renderOperationRunner({ permissions: { canSplit: false, canMerge: false } })

    act(() => result.current.handleOperation('split'))
    expect(setLastError).toHaveBeenCalledWith('Split is unavailable for this role.')

    act(() => result.current.handleOperation('merge'))
    expect(setLastError).toHaveBeenCalledWith('Merge is unavailable for this role.')
  })

  it('completes successful operations and appends history', () => {
    const { result, setFeedback, setLastError } = renderOperationRunner()

    act(() => result.current.handleOperation('split'))
    act(() => vi.advanceTimersByTime(2000))

    expect(result.current.operationState).toMatchObject({ status: 'done', label: 'split', progress: 100 })
    expect(result.current.workspaceDoc.history).toContain('Split completed')
    expect(setLastError).toHaveBeenCalledWith('')
    expect(setFeedback).toHaveBeenCalledWith('split completed and the document state was updated.')
  })

  it('marks divisible-by-five claims as failed and supports cancel', () => {
    const { result, setFeedback, setLastError } = renderOperationRunner({ selectedClaim: { id: 1000, claimant: 'Claimant 1' } })

    act(() => result.current.handleOperation('merge'))
    act(() => vi.advanceTimersByTime(2000))

    expect(result.current.operationState).toMatchObject({ status: 'failed', label: 'merge', progress: 100 })
    expect(setLastError).toHaveBeenCalledWith('Temporary storage lock while writing the document package. Retry to continue.')
    expect(setFeedback).toHaveBeenCalledWith('The operation paused because of a storage lock. Review and retry.')

    act(() => result.current.cancelOperation())
    expect(result.current.operationState).toEqual({ status: 'idle', label: '', progress: 0 })
  })
})