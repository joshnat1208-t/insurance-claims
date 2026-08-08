import { useEffect, useRef, useState } from 'react'

export default function useToast() {
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const toastTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = (message, type = 'info') => {
    setToastMessage(message)
    setToastType(type)

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('')
      setToastType('info')
    }, 4000)
  }

  return {
    toastMessage,
    toastType,
    showToast,
  }
}