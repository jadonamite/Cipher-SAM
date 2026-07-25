'use client'

import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { brandIcons } from '@/components/ui/BrandIcons'

// ... (unchanged imports and constants)

const calculateBleedTarget = (phase: number, notifications: Notification[]) => {
  let target = 0
  if (phase === 0 || phase === 9) target = 0
  else if (phase <= 5) {
    // Sum of appeared notifications
    target = notifications.slice(0, phase).reduce((s, n) => s + n.amount, 0)
  } else if (phase === 6) target = notifications.reduce((s, n) => s + n.amount, 0)
  else if (phase === 7 || phase === 8) target = notifications.filter((n) => !n.unused).reduce((s, n) => s + n.amount, 0)
  return target
}

export default function NotificationCascade() {
  // ... (unchanged state and effects)

  useEffect(() => {
    const target = calculateBleedTarget(phase, NOTIFICATIONS)
    const controls = animate(bleedValue, target, {
      duration: phase === 7 ? 0.9 : phase === 0 ? 0.3 : 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return controls.stop
  }, [phase, bleedValue])

  // ... (unchanged render logic)
}