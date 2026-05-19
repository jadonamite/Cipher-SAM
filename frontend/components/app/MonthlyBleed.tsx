'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface MonthlyBleedProps {
  amount: number
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame: number
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

export default function MonthlyBleed({ amount }: MonthlyBleedProps) {
  const display = useCountUp(amount)
  const yearly = amount * 12

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-1"
    >
      <div className="flex items-end gap-2">
        <span
          style={{
            fontFamily: 'var(--font-dm-mono)',
            color: '#fff',
            fontSize: 'clamp(48px, 7vw, 72px)',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontWeight: 500,
          }}
        >
          ${display.toFixed(2)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-dm-mono)',
            color: '#525252',
            fontSize: '16px',
            marginBottom: '8px',
          }}
        >
          /month
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-geist-sans)',
          color: '#525252',
          fontSize: '12px',
          letterSpacing: '0.02em',
        }}
      >
        You'll spend{' '}
        <span style={{ color: '#E50914', fontFamily: 'var(--font-dm-mono)' }}>
          ${yearly.toFixed(2)}
        </span>{' '}
        this year if nothing changes.
      </span>
    </motion.div>
  )
}
