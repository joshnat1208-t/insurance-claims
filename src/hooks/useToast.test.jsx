import { act, renderHook } from '@testing-library/react'
import useToast from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
  })

  it('shows a toast and clears it after the timeout', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.showToast('Saved', 'success'))
    expect(result.current.toastMessage).toBe('Saved')
    expect(result.current.toastType).toBe('success')

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(result.current.toastMessage).toBe('')
    expect(result.current.toastType).toBe('info')
  })
})