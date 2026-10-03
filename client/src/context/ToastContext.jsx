import { createContext, useCallback, useContext, useState } from 'react'
import { Check, CircleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), [])
  const notify = useCallback((message, kind = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((items) => [...items, { id, message, kind }])
    window.setTimeout(() => dismiss(id), 3800)
  }, [dismiss])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.kind}`} key={toast.id} role="status">
            {toast.kind === 'error' ? <CircleAlert size={17} /> : <Check size={17} />}
            <span>{toast.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}