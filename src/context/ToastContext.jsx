import { createContext, useContext, useState, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ msg: '', type: 'success', visible: false })
  const timerRef = useRef(null)

  function showToast(msg, type = 'success') {
    clearTimeout(timerRef.current)
    setToast({ msg, type, visible: true })
    timerRef.current = setTimeout(() => {
      setToast(t => ({ ...t, visible: false }))
    }, 3200)
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className={`toast ${toast.type}${toast.visible ? ' show' : ''}`}
        role="status"
        aria-live="polite"
      >
        <span className="toast-dot"></span>
        <span>{toast.msg}</span>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
