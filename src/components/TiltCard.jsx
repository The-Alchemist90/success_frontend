import { useRef } from 'react'


export default function TiltCard({ children, className = '' }) {
  const ref = useRef(null)
  const still = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function onMove(event) {
    const el = ref.current
    if (!el || still()) return
    const box = el.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width - 0.5
    const y = (event.clientY - box.top) / box.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`
  }
  function reset() {
    if (ref.current) ref.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)'
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  )
}