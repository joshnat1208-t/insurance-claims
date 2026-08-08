import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import usePageActions from './usePageActions'
import { createWorkspaceDoc } from '../test/fixtures'

function renderPageActions(options = {}) {
  const showToast = vi.fn()
  const setLastError = vi.fn()
  const setFeedback = vi.fn()

  const { result } = renderHook(() => {
    const [workspaceDoc, setWorkspaceDoc] = useState(options.workspaceDoc ?? createWorkspaceDoc())
    const [selectedPage, setSelectedPage] = useState(Object.hasOwn(options, 'selectedPage') ? options.selectedPage : 2)
    const [commentDraft, setCommentDraft] = useState(options.commentDraft ?? 'Follow up required')

    const hook = usePageActions({
      permissions: options.permissions ?? { canDelete: true },
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

    return {
      ...hook,
      workspaceDoc,
      selectedPage,
      commentDraft,
    }
  })

  return { result, showToast, setLastError, setFeedback }
}

describe('usePageActions', () => {
  it('blocks delete when the role lacks permission', () => {
    const { result, showToast, setLastError } = renderPageActions({ permissions: { canDelete: false } })

    act(() => result.current.handlePageDelete())

    expect(setLastError).toHaveBeenCalledWith('Delete is blocked for this role.')
    expect(showToast).toHaveBeenCalledWith('Delete is blocked for this role.', 'error')
  })

  it('deletes the selected page and moves selection safely', () => {
    const { result, showToast, setFeedback } = renderPageActions({ selectedPage: 2 })

    act(() => result.current.handlePageDelete())

    expect(result.current.workspaceDoc.pages.map((page) => page.id)).toEqual([1, 3, 4])
    expect(result.current.selectedPage).toBe(1)
    expect(setFeedback).toHaveBeenCalledWith('Deleted page 2 from the document.')
    expect(showToast).toHaveBeenCalledWith('Document page deleted successfully.', 'success')
  })

  it('blocks page delete when no page is selected', () => {
    const { result, setLastError } = renderPageActions({ selectedPage: null })

    act(() => result.current.handlePageDelete())

    expect(setLastError).toHaveBeenCalledWith('Select a page before deleting it.')
  })

  it('validates and appends comments', () => {
    const { result, setLastError, setFeedback } = renderPageActions({ commentDraft: '   ', selectedPage: 1 })

    act(() => result.current.handleAddComment())
    expect(setLastError).toHaveBeenCalledWith('Enter a page comment before saving it.')

    const success = renderPageActions({ commentDraft: 'Needs resend', selectedPage: 1 })
    act(() => success.result.current.handleAddComment())

    expect(success.result.current.workspaceDoc.pages[0].comments).toContain('Needs resend')
    expect(success.result.current.commentDraft).toBe('')
    expect(success.result.current.selectedPageData.id).toBe(1)
    expect(setFeedback).not.toHaveBeenCalledWith('Comment added to page 1.')
    expect(success.setFeedback).toHaveBeenCalledWith('Comment added to page 1.')
  })

  it('saves claimant-level comments when no page is selected', () => {
    const { result, setFeedback } = renderPageActions({ commentDraft: 'Claim level note', selectedPage: null })

    act(() => result.current.handleAddComment())

    expect(result.current.workspaceDoc.claimComments).toContain('Claim level note')
    expect(result.current.selectedPageData).toBeNull()
    expect(setFeedback).toHaveBeenCalledWith('Comment added to claimant.')
  })

  it('saves page comment for selected page that is in packages', () => {
    const workspaceDoc = createWorkspaceDoc({
      pages: [
        { id: 1, label: 'Page 1', comments: [] },
        { id: 2, label: 'Page 2', comments: [] },
      ],
      packages: [
        [{ id: 1, label: 'Page 1', comments: [] }, { id: 2, label: 'Page 2', comments: [] }],
        [{ id: 3, label: 'Page 3', comments: [] }, { id: 4, label: 'Page 4', comments: [] }],
      ],
    })

    const { result, setFeedback } = renderPageActions({
      workspaceDoc,
      selectedPage: 3,
      commentDraft: 'Package page note',
    })

    act(() => result.current.handleAddComment())

    expect(result.current.workspaceDoc.packages[1][0].comments).toContain('Package page note')
    expect(result.current.workspaceDoc.claimComments).not.toContain('Package page note')
    expect(setFeedback).toHaveBeenCalledWith('Comment added to page 3.')
  })
})