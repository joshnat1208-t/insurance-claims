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

  const targetPageId = selectedPage

  setWorkspaceDoc((current) => {
    if (!current) return current

    // 1. Filter flat pages array using String cast comparison
    const updatedPages = (current.pages || []).filter(
      (page) => String(page.id) !== String(targetPageId)
    )

    // 2. Filter nested packages safely
    const updatedPackages = (current.packages || []).map((pkg) => {
      if (pkg && Array.isArray(pkg.pages)) {
        return {
          ...pkg,
          pages: pkg.pages.filter((page) => String(page.id) !== String(targetPageId)),
        }
      }
      if (Array.isArray(pkg)) {
        return pkg.filter((page) => String(page.id) !== String(targetPageId))
      }
      return pkg
    })

    // 3. Determine next selected page safely
    const remainingPages = updatedPages.length > 0
      ? updatedPages
      : (updatedPackages || []).flatMap((pkg) => Array.isArray(pkg) ? pkg : (pkg?.pages || []))

    const nextSelectedPageId = remainingPages.length > 0 ? remainingPages[0].id : null
    setSelectedPage(nextSelectedPageId)

    return {
      ...current,
      pages: updatedPages,
      packages: updatedPackages,
    }
  })

  setFeedback(`Deleted page ${targetPageId} from the document.`)
  showToast('Document page deleted successfully.', 'success')
}, [hasSelectedPage, permissions.canDelete, selectedPage, setLastError, setWorkspaceDoc, setSelectedPage, setFeedback, showToast])

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
          ? current.packages.map((pkg) =>
              pkg.map((page) => {
                if (page.id !== selectedPage) return page
                return { ...page, comments: [...page.comments, draft] }
              })
            )
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