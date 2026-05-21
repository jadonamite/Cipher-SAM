'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { brandIcons } from '@/components/ui/BrandIcons'

type Notification = {
  brand: string
  amount: number
  charged: string
  unused: boolean
}

const NOTIFICATIONS: Notification[] = [
  { brand: 'YouTube Premium', amount: 13.99, charged: 'just now', unused: false },
  { brand: 'Netflix', amount: 15.49, charged: '2 min ago', unused: false },
  { brand: 'Spotify', amount: 9.99, charged: '4 min ago', unused: true },
  { brand: 'Notion AI', amount: 20.0, charged: '6 min ago', unused: false },
  { brand: 'Figma Pro', amount: 15.0, charged: '8 min ago', unused: true },
]

const TIMELINE = {
  appear: [0.3, 1.0, 1.7, 2.4, 3.1],
  scan: 4.0,
  flag: 4.8,
  clean: 5.8,
  hold: 7.2,
  reset: 7.8,
  total: 8.2,
}

const TOTAL_BLEED = NOTIFICATIONS.reduce((s, n) => s + n.amount, 0)
const CLEAN_BLEED = NOTIFICATIONS.filter((n) => !n.unused).reduce((s, n) => s + n.amount, 0)

export default function NotificationCascade() {
  const [time, setTime] = useState(0)

  useEffect(() => {
    let start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000
      if (elapsed >= TIMELINE.total) start = now
      setTime(elapsed % TIMELINE.total)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const visibleCount = TIMELINE.appear.filter((t) => time >= t).length
  const scanning = time >= TIMELINE.scan && time < TIMELINE.clean
  const flagged = time >= TIMELINE.flag
  const cleaning = time >= TIMELINE.clean

  const bleed = (() => {
    if (time < TIMELINE.appear[0]) return 0
    const appeared = NOTIFICATIONS.slice(0, visibleCount).reduce((s, n) => s + n.amount, 0)
    if (!cleaning) return appeared
    // Tween down during clean phase (1.4s window)
    const cleanProgress = Math.min(1, (time - TIMELINE.clean) / 1.4)
    const removed = (TOTAL_BLEED - CLEAN_BLEED) * cleanProgress
    return Math.max(CLEAN_BLEED, TOTAL_BLEED - removed)
  })()

  return (
    <div className="w-full max-w-[400px] mx-auto lg:mx-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span
          className="uppercase text-muted"
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '0.18em',
          }}
        >
          Live from your inbox
        </span>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: '#E50914' }}
        />
      </div>

      {/* Notification stack */}
      <div className="relative" style={{ minHeight: '340px' }}>
        {/* Scanner sweep */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              key="scan"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: 320, opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="absolute left-0 right-0 pointer-events-none z-10"
              style={{
                height: '40px',
                background:
                  'linear-gradient(180deg, transparent, rgba(229,9,20,0.18), transparent)',
                borderTop: '1px solid rgba(229,9,20,0.5)',
                borderBottom: '1px solid rgba(229,9,20,0.5)',
              }}
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {NOTIFICATIONS.map((notif, i) => {
              const visible = time >= TIMELINE.appear[i]
              const isFlagged = flagged && notif.unused
              const isRemoved = cleaning && notif.unused
              if (!visible) return null

              const tilt = ((i % 2 === 0 ? -1 : 1) * (0.4 + i * 0.15)).toFixed(2)

              return (
                <motion.div
                  key={`${notif.brand}-${Math.floor(time / TIMELINE.total)}`}
                  initial={{ opacity: 0, x: 40, rotate: 0 }}
                  animate={{
                    opacity: isRemoved ? 0 : 1,
                    x: isRemoved ? 60 : 0,
                    rotate: parseFloat(tilt),
                    scale: isFlagged && !isRemoved ? 1.01 : 1,
                  }}
                  exit={{ opacity: 0, x: 60 }}
                  transition={{
                    duration: isRemoved ? 0.6 : 0.45,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="relative rounded-sm flex items-center gap-3 px-4 py-3"
                  style={{
                    backgroundColor: '#161616',
                    border: isFlagged
                      ? '1px solid rgba(229,9,20,0.6)'
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isFlagged
                      ? '0 0 0 1px rgba(229,9,20,0.15), 0 8px 24px rgba(229,9,20,0.08)'
                      : '0 4px 14px rgba(0,0,0,0.4)',
                  }}
                >
                  <div className="w-9 h-9 rounded-sm overflow-hidden shrink-0">
                    {brandIcons[notif.brand] ?? (
                      <div
                        className="w-full h-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#1C1C1C', color: '#E50914' }}
                      >
                        {notif.brand[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-white text-xs font-medium truncate"
                        style={{
                          fontFamily: 'var(--font-geist-sans)',
                          textDecoration: isRemoved ? 'line-through' : 'none',
                        }}
                      >
                        Your {notif.brand} subscription
                      </p>
                      {isFlagged && !isRemoved && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="uppercase shrink-0"
                          style={{
                            fontFamily: 'var(--font-dm-mono)',
                            fontSize: '8px',
                            letterSpacing: '0.12em',
                            color: '#E50914',
                            border: '1px solid rgba(229,9,20,0.6)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                          }}
                        >
                          Unused
                        </motion.span>
                      )}
                    </div>
                    <p
                      className="text-muted"
                      style={{
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: '10px',
                      }}
                    >
                      Continues — charged {notif.charged}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className="font-medium"
                      style={{
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: '13px',
                        color: isFlagged ? '#E50914' : '#FFFFFF',
                      }}
                    >
                      ${notif.amount.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Bleed counter */}
      <div
        className="mt-5 rounded-sm px-4 py-3 flex items-end justify-between"
        style={{
          backgroundColor: '#0F0F0F',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div>
          <p
            className="uppercase text-muted mb-1"
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.18em',
            }}
          >
            Monthly bleed
          </p>
          <motion.p
            className="text-white"
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: cleaning ? '#E50914' : '#FFFFFF',
            }}
            animate={{ color: cleaning ? '#E50914' : '#FFFFFF' }}
            transition={{ duration: 0.6 }}
          >
            ${bleed.toFixed(2)}
          </motion.p>
        </div>
        {cleaning && time < TIMELINE.hold && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-right"
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                color: '#E50914',
                letterSpacing: '0.05em',
              }}
            >
              SAM cancelled 2
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                color: '#8a8a8a',
              }}
            >
              −${(TOTAL_BLEED - CLEAN_BLEED).toFixed(2)}/mo
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
