import { useEffect, useRef, useState } from 'react'

export default function useOperationRunner({
  permissions,
  selectedClaim,
  workspaceDoc,
  setWorkspaceDoc,
  setFeedback,
  setLastError,
}) {
  const [operationState, setOperationState] = useState({ status: 'idle', label: '', progress: 0 })
  const operationTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (operationTimerRef.current) window.clearInterval(operationTimerRef.current)
    }
  }, [])

  const handleOperation = (label) => {
    if (!permissions.canSplit && label === 'split') {
      setLastError('Split is unavailable for this role.')
      return
    }
    if (!permissions.canMerge && label === 'merge') {
      setLastError('Merge is unavailable for this role.')
      return
    }

    if (operationTimerRef.current) window.clearInterval(operationTimerRef.current)
    setOperationState({ status: 'running', label, progress: 0 })
    setLastError('')
    setFeedback(`Processing ${label} request for ${selectedClaim.claimant}.`)

    let progress = 0
    operationTimerRef.current = window.setInterval(() => {
      progress += 12
      if (progress >= 100) {
        window.clearInterval(operationTimerRef.current)
        const shouldFail = selectedClaim.id % 5 === 0
        if (shouldFail) {
          setOperationState({ status: 'failed', label, progress: 100 })
          setLastError('Temporary storage lock while writing the document package. Retry to continue.')
          setFeedback('The operation paused because of a storage lock. Review and retry.')
        } else {
          const nextHistory = [
            ...workspaceDoc.history,
            `${label.charAt(0).toUpperCase() + label.slice(1)} completed`,
          ]
          setWorkspaceDoc((current) => ({ ...current, history: nextHistory }))
          setOperationState({ status: 'done', label, progress: 100 })
          setFeedback(`${label} completed and the document state was updated.`)
        }
        return
      }
      setOperationState((current) => ({ ...current, progress }))
    }, 180)
  }

  const cancelOperation = () => {
    if (operationTimerRef.current) window.clearInterval(operationTimerRef.current)
    setOperationState({ status: 'idle', label: '', progress: 0 })
    setFeedback('Operation cancelled. The workspace remains in a safe state.')
  }

  return {
    operationState,
    setOperationState,
    handleOperation,
    cancelOperation,
  }
}