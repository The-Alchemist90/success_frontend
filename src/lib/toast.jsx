import { useCallback, useEffect, useRef, useState } from 'react'

/** const { notify, toast } = useToast()  ->  notify('Saved')  and render {toast} once in the page. */
export function useToast() {
  const [current, setCurrent] = useState(null)
  const timer = useRef(null)
  const notify = useCallback((message, kind = 'success') => {
    setCurrent({ message, kind })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCurrent(null), 3800)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  const toast = current && (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-[70] max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-3 text-label-lg shadow-2xl ${
        current.kind === 'error' ? 'bg-error text-white' : 'bg-on-surface text-surface'
      }`}
    >
      {current.message}
    </div>
  )
  return { notify, toast }
}