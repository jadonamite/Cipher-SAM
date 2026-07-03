'use client'

import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { brandIcons } from '@/components/ui/BrandIcons'

const calculateTargetValue = (phase: number, notifications: any[]) => {
  let target = 0
  if (phase === 0 || phase === 9) target = 0
  else if (phase <= 5) {
    // Sum of appeared notifications
    target = notifications.slice(0, phase).reduce((s: number, n: any) => s + n.amount, 0)
  } else if (phase === 6) target = notifications.reduce((s: number, n: any) => s + n.amount, 0)
  else if (phase === 7 || phase === 8) target = notifications.filter((n: any) => !n.unused).reduce((s: number, n: any) => s + n.amount, 0)
  return target
}

const NotificationCascade = () => {
  const [phase, setPhase] = useState(0)
  const bleedValue = useMotionValue(0)
  const bleedDisplay = useTransform(bleedValue, (v: number) => `$${v.toFixed(2)}`)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const advance = (current: number) => {
      timer = setTimeout(() => {
        if (cancelled) return
        const next = (current + 1) % SCHEDULE.length
        setPhase(next)
        advance(next)
      }, SCHEDULE[current])
    }

    advance(phase)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drive bleed counter via motion value (smooth tween, no React re-render per frame)
  useEffect(() => {
    const target = calculateTargetValue(phase, NOTIFICATIONS)

    const controls = animate(bleedValue, target, {
      duration: phase === 7 ? 0.9 : phase === 0 ? 0.3 : 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return controls.stop
  }, [phase, bleedValue])

  // ... rest of the code remains the same
}