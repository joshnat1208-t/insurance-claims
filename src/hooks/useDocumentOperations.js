import { useCallback, useEffect, useMemo, useState } from 'react'

function chunkPages(pages, size) {
  const packages = []
  for (let i = 0; i < pages.length; i += size) {
    packages.push(pages.slice(i, i + size))
  }
  return packages
}

export default function useDocumentOperations({
  permissions,
  workspaceDoc,
  setWorkspaceDoc,
  setFeedback,
  setLastError,
  showToast,
  setOperationState,
}) {
  const [splitModalOpen, setSplitModalOpen] = useState(false)
  const [splitSize, setSplitSize] = useState(10)
  const [splitPreview, setSplitPreview] = useState([])
  const [lastSplitBackup, setLastSplitBackup] = useState(null)
  const [mergeModalOpen, setMergeModalOpen] = useState(false)
  const [mergePreview, setMergePreview] = useState([])
  const [mergeSelection, setMergeSelection] = useState([])
  const [lastMergeBackup, setLastMergeBackup] = useState(null)
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0)

  const openSplitPreview = useCallback(() => {
    if (!permissions.canSplit) {
      setLastError('Split is unavailable for this role.')
      showToast('Split is unavailable for this role.', 'error')
      return
    }

    const base = workspaceDoc?.packages?.length ? workspaceDoc.packages.flat() : workspaceDoc.pages
    const packages = chunkPages(base || [], splitSize)
    setSplitPreview(packages)
    setSplitModalOpen(true)
  }, [permissions.canSplit, setLastError, showToast, workspaceDoc, splitSize])

  useEffect(() => {
    if (!splitModalOpen) return
    const base = workspaceDoc?.packages?.length ? workspaceDoc.packages.flat() : workspaceDoc.pages
    const packages = chunkPages(base || [], Math.max(1, Number(splitSize) || 1))
    setSplitPreview(packages)
  }, [splitSize, workspaceDoc, splitModalOpen])

  const confirmSplit = useCallback(() => {
    if (!splitPreview.length) return

    setLastSplitBackup(workspaceDoc)
    const packages = splitPreview
    setWorkspaceDoc((current) => ({ ...current, pages: packages[0], packages }))
    setCurrentPackageIndex(0)
    setSplitModalOpen(false)
    setFeedback(`Split into ${packages.length} packages.`)
    setOperationState({ status: 'done', label: 'split', progress: 100 })
    showToast(`Split into ${packages.length} packages.`, 'success')
    window.setTimeout(() => setOperationState({ status: 'idle', label: '', progress: 0 }), 1200)
  }, [splitPreview, workspaceDoc, setWorkspaceDoc, setFeedback, setOperationState, showToast])

  const undoSplit = useCallback(() => {
    if (!lastSplitBackup) return
    setWorkspaceDoc(lastSplitBackup)
    setLastSplitBackup(null)
    setCurrentPackageIndex(0)
    setFeedback('Split undone.')
    showToast('Split undone.', 'info')
  }, [lastSplitBackup, setWorkspaceDoc, setFeedback, showToast])

  const openMergePreview = useCallback(() => {
    if (!permissions.canMerge) {
      setLastError('Merge is unavailable for this role.')
      showToast('Merge is unavailable for this role.', 'error')
      return
    }

    const base = workspaceDoc?.packages?.length ? workspaceDoc.packages.flat() : workspaceDoc.pages
    const packages = workspaceDoc.packages && workspaceDoc.packages.length ? workspaceDoc.packages : chunkPages(base || [], splitSize)
    setMergePreview(packages)
    setMergeSelection([])
    setMergeModalOpen(true)
  }, [permissions.canMerge, setLastError, showToast, workspaceDoc, splitSize])

  const toggleMergeSelection = useCallback((idx) => {
    setMergeSelection((current) => {
      if (current.includes(idx)) return current.filter((i) => i !== idx)
      return [...current, idx]
    })
  }, [])

  const confirmMerge = useCallback(() => {
    if (!mergePreview.length) return
    if (mergeSelection.length < 2) {
      showToast('Select at least two packages to merge.', 'error')
      return
    }

    const selected = [...mergeSelection].sort((a, b) => a - b)
    const mergedPages = selected.flatMap((i) => mergePreview[i])
    setLastMergeBackup(workspaceDoc)
    const remaining = mergePreview.filter((_, idx) => !selected.includes(idx))

    setWorkspaceDoc((current) => ({
      ...current,
      pages: mergedPages,
      packages: remaining.length ? remaining : undefined,
    }))

    setCurrentPackageIndex(0)
    setMergeModalOpen(false)
    setFeedback(`Merged ${selected.length} packages into one.`)
    setOperationState({ status: 'done', label: 'merge', progress: 100 })
    showToast(`Merged ${selected.length} packages.`, 'success')
    window.setTimeout(() => setOperationState({ status: 'idle', label: '', progress: 0 }), 1200)
  }, [mergePreview, mergeSelection, showToast, workspaceDoc, setWorkspaceDoc, setFeedback, setOperationState])

  const undoMerge = useCallback(() => {
    if (!lastMergeBackup) return
    setWorkspaceDoc(lastMergeBackup)
    setLastMergeBackup(null)
    setCurrentPackageIndex(0)
    setFeedback('Merge undone.')
    showToast('Merge undone.', 'info')
  }, [lastMergeBackup, setWorkspaceDoc, setFeedback, showToast])

  const availablePackageCount = useMemo(() => {
    const fullPages = workspaceDoc?.packages?.length ? workspaceDoc.packages.flat() : (workspaceDoc?.pages || [])
    return workspaceDoc?.packages?.length ?? chunkPages(fullPages, splitSize).length
  }, [workspaceDoc, splitSize])

  const canMergeNow = permissions.canMerge && availablePackageCount >= 2

  return {
    splitModalOpen,
    setSplitModalOpen,
    splitSize,
    setSplitSize,
    splitPreview,
    lastSplitBackup,
    mergeModalOpen,
    setMergeModalOpen,
    mergePreview,
    mergeSelection,
    lastMergeBackup,
    currentPackageIndex,
    setCurrentPackageIndex,
    availablePackageCount,
    canMergeNow,
    openSplitPreview,
    confirmSplit,
    undoSplit,
    openMergePreview,
    toggleMergeSelection,
    confirmMerge,
    undoMerge,
  }
}