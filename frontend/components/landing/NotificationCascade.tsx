'use client'

import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { brandIcons } from '@/components/ui/BrandIcons'

// ... (unchanged imports and constants)

const calculateTarget = (phase: number, notifications: Notification[]) => {
  if (phase === 0 || phase === 9) return 0
  else if (phase <= 5) {
    // Sum of appeared notifications
    return notifications.slice(0, phase).reduce((s, n) => s + n.amount, 0)
  } else if (phase === 6) return notifications.reduce((s, n) => s + n.amount, 0)
  else if (phase === 7 || phase === 8) return notifications.filter((n) => !n.unused).reduce((s, n) => s + n.amount, 0)
}

export default function NotificationCascade() {
  // ... (unchanged state and effects)

  useEffect(() => {
    let target = calculateTarget(phase, NOTIFICATIONS)
    const controls = animate(bleedValue, target, {
      duration: phase === 7 ? 0.9 : phase === 0 ? 0.3 : 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return controls.stop
  }, [phase, bleedValue])

  // ... (unchanged render logic)
}