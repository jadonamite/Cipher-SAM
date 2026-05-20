'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

const radarItems = [
  { name: 'Netflix', amount: '$15.99/mo', confidence: 94, category: 'Entertainment' },
  { name: 'Figma Pro', amount: '$15/mo', confidence: 87, category: 'Design' },
  { name: 'Notion AI', amount: '$16/mo', confidence: 73, category: 'Productivity' },
  { name: 'GitHub Copilot', amount: '$10/mo', confidence: 91, category: 'Dev Tools' },
]

function ConfidenceTicker({ target, active }: { target: number; active: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    let frame = 0
    const total = 40
    const interval = setInterval(() => {
      frame++
      setCount(Math.floor((frame / total) * target))
      if (frame >= total) clearInterval(interval)
    }, 18)
    return () => clearInterval(interval)
  }, [active, target])

  return (
    <span style={{ fontFamily: 'var(--font-dm-mono)' }} className="text-sam-red text-xs font-medium">
      {count}%
    </span>
  )
}

function SubscriptionRadar() {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= radarItems.length) {
          clearInterval(interval)
          return c
        }
        return c + 1
      })
    }, 700)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{
        backgroundColor: '#141414',
        border: '1px solid rgba(255,255,255,0.06)',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span
          className="text-secondary uppercase text-xs tracking-widest"
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px' }}
        >
          SAM scanning
        </span>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: '#E50914' }}
        />
      </div>

      <div className="p-2">
        <AnimatePresence>
          {radarItems.slice(0, visibleCount).map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center justify-between px-3 py-3 rounded-sm"
              style={{
                borderBottom:
                  i < radarItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#1C1C1C', color: '#E50914', fontFamily: 'var(--font-syne)' }}
                >
                  {item.name[0]}
                </div>
                <div>
                  <p className="text-white text-xs font-medium" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    {item.name}
                  </p>
                  <p className="text-muted" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px' }}>
                    {item.category}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-xs" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                  {item.amount}
                </p>
                <ConfidenceTicker target={item.confidence} active={i < visibleCount} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {visibleCount < radarItems.length && (
          <div className="px-3 py-3 flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-muted text-xs"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px' }}
            >
              detecting...
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Hero() {
  const { ready, authenticated, login } = usePrivy()
  const router = useRouter()
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    if (entering && authenticated) router.push('/dashboard')
  }, [entering, authenticated, router])

  function handleCTA() {
    if (!ready) return
    if (authenticated) router.push('/dashboard')
    else {
      setEntering(true)
      login()
    }
  }

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ backgroundColor: '#0D0D0D' }}
    >
      {/* Particle field — subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Red ambient glow top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-24">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-16">
          {/* Left — 60% */}
          <div className="flex-1">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="uppercase text-muted mb-6"
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '11px',
                letterSpacing: '0.16em',
              }}
            >
              Ciphergon / SAM
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-white font-extrabold leading-none mb-6"
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: 'clamp(26px, 7.5vw, 100px)',
                letterSpacing: '-0.03em',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              Your subscriptions
              <br />
              <span style={{ color: '#E50914' }}>are bleeding you.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-secondary mb-10"
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '14px',
                letterSpacing: '0.01em',
              }}
            >
              $2,847 lost to forgotten subscriptions last year. On average.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <Button size="lg" onClick={handleCTA}>Connect &amp; Find Out</Button>
            </motion.div>
          </div>

          {/* Right — 40% */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full lg:w-auto lg:min-w-[380px]"
          >
            <SubscriptionRadar />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.div
          animate={{ scaleY: [0, 1, 0], y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '1px',
            height: '32px',
            backgroundColor: '#E50914',
            transformOrigin: 'top',
          }}
        />
      </div>
    </section>
  )
}
