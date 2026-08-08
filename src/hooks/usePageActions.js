import { useCallback, useMemo } from 'react'

export default function usePageActions({
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
}) {
  const hasSelectedPage = selectedPage !== null && selectedPage !== undefined

  const findPageById = (doc, pageId) => {
    const fromPages = doc?.pages?.find((page) => page.id === pageId)
    if (fromPages) return fromPages
    if (!doc?.packages?.length) return null
    for (const pkg of doc.packages) {
      const match = pkg.find((page) => page.id === pageId)
      if (match) return match
    }
    return null
  }

  const handlePageDelete = useCallback(() => {
    if (!hasSelectedPage) {
      setLastError('Select a page before deleting it.')
      return
    }

    if (!permissions.canDelete) {
      setLastError('Delete is blocked for this role.')
      showToast('Delete is blocked for this role.', 'error')
      return
    }

    setWorkspaceDoc((current) => {
      const updatedPages = current.pages.filter((page) => page.id !== selectedPage)
      const nextSelectedPage = updatedPages.length ? updatedPages[0].id : null
      if (nextSelectedPage === null) {
        setSelectedPage(1)
      } else if (nextSelectedPage !== selectedPage) {
        setSelectedPage(nextSelectedPage)
      }
      return {
        ...current,
        pages: updatedPages,
      }
    })

    setFeedback(`Deleted page ${selectedPage} from the document.`)
    showToast('Document page deleted successfully.', 'success')
  }, [hasSelectedPage, permissions.canDelete, setLastError, showToast, setWorkspaceDoc, selectedPage, setSelectedPage, setFeedback])

  const handleAddComment = useCallback(() => {
    if (!commentDraft.trim()) {
      setLastError('Enter a page comment before saving it.')
      return
    }

    const draft = commentDraft.trim()
    const canSaveToPage = hasSelectedPage && Boolean(findPageById(workspaceDoc, selectedPage))

    if (canSaveToPage) {
      setWorkspaceDoc((current) => {
        const nextPages = current.pages.map((page) => {
          if (page.id !== selectedPage) return page
          return { ...page, comments: [...page.comments, draft] }
        })

        const nextPackages = current.packages?.length
          ? current.packages.map((pkg) => pkg.map((page) => {
            if (page.id !== selectedPage) return page
            return { ...page, comments: [...page.comments, draft] }
          }))
          : current.packages

        return {
          ...current,
          pages: nextPages,
          packages: nextPackages,
        }
      })
      setFeedback(`Comment added to page ${selectedPage}.`)
    } else {
      setWorkspaceDoc((current) => ({
        ...current,
        claimComments: [...(current.claimComments || []), draft],
      }))
      setFeedback('Comment added to claimant.')
    }

    setCommentDraft('')
  }, [commentDraft, hasSelectedPage, workspaceDoc, selectedPage, setLastError, setWorkspaceDoc, setCommentDraft, setFeedback])

  const selectedPageData = useMemo(
    () => (hasSelectedPage ? (findPageById(workspaceDoc, selectedPage) ?? null) : null),
    [hasSelectedPage, workspaceDoc, selectedPage],
  )

  return {
    handlePageDelete,
    handleAddComment,
    selectedPageData,
  }
}