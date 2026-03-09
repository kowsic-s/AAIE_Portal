import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, duration = 1400, trigger = true) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (!trigger) return
    let current = 0
    const increment = (target / duration) * 16
    const tick = () => {
      current = Math.min(current + increment, target)
      setValue(Math.floor(current))
      if (current < target) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, trigger])

  return value
}
