'use client'

import { motion, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion'
import { useRef } from 'react'

const mockSubs = [
  { name: 'Netflix', amount: '$15.99', cadence: 'monthly', confidence: 94, tag: 'UNDERUSED' },
  { name: 'Figma Pro', amount: '$15.00', cadence: 'monthly', confidence: 87, tag: 'REVIEW' },
  { name: 'Notion AI', amount: '$16.00', cadence: 'monthly', confidence: 73, tag: 'ACTIVE' },
  { name: 'GitHub Copilot', amount: '$10.00', cadence: 'monthly', confidence: 91, tag: 'KEEP' },
  { name: 'Loom Pro', amount: '$12.50', cadence: 'monthly', confidence: 68, tag: 'UNDERUSED' },
]

const tagColors: Record<string, string> = {
  UNDERUSED: '#E50914',
  REVIEW: '#D97706',
  ACTIVE: '#16A34A',
  KEEP: '#525252',
}

function NetflixIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect width="32" height="32" rx="2" fill="#E50914" />
      <path d="M10 7h3.2v7.8L16.8 7H20v18h-3.2v-7.8L13.2 25H10V7z" fill="white" />
    </svg>
  )
}

function FigmaIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect width="32" height="32" rx="2" fill="#1E1E1E" />
      {/* Top-left: red */}
      <path d="M10 5h6v7h-6a3.5 3.5 0 0 1 0-7z" fill="#F24E1E" />
      {/* Top-right: orange */}
      <path d="M16 5h6a3.5 3.5 0 0 1 0 7h-6V5z" fill="#FF7262" />
      {/* Middle-left: green */}
      <path d="M10 12h6v7h-6a3.5 3.5 0 0 1 0-7z" fill="#0ACF83" />
      {/* Center circle: purple */}
      <circle cx="19.5" cy="15.5" r="3.5" fill="#A259FF" />
      {/* Bottom: blue */}
      <path d="M10 19h6v3.5A3.5 3.5 0 0 1 10 19z" fill="#1ABCFE" />
    </svg>
  )
}

function NotionIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect width="32" height="32" rx="2" fill="#FAFAF8" />
      <path
        d="M8.5 7.5c.8.7 1.1.6 2.6.5l14.1-.8c.3 0 .3.4 0 .4l-2.3.3c-.4.1-.8.4-1 .8L9.4 25.2c-.1.3-.6.1-.6-.2V8.8c0-.6.3-1 .7-.7l-.9-.6H8.5zm3 2.1l8.3 12.3V11c0-.4-.2-.5-.5-.6l-2-.4c-.3 0-.3-.4 0-.4h5.6c.3 0 .3.4 0 .4l-1.5.4c-.3.1-.5.3-.5.7v13.5c0 .4-.5.5-.7.2l-9.7-14.4c-.2-.3.1-.7.4-.5l.6.8z"
        fill="#191919"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect width="32" height="32" rx="2" fill="#161B22" />
      <path
        d="M16 5.2C10.48 5.2 6 9.68 6 15.2c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48 0-.23-.01-.86-.01-1.69-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 16 10.84c.85 0 1.7.11 2.5.34 1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85 0 1.34-.01 2.41-.01 2.74 0 .27.18.58.69.48A10.02 10.02 0 0 0 26 15.2C26 9.68 21.52 5.2 16 5.2z"
        fill="white"
      />
    </svg>
  )
}

function LoomIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect width="32" height="32" rx="2" fill="#5046E4" />
      <circle cx="16" cy="16" r="7" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3" fill="white" />
      <circle cx="16" cy="9" r="1.5" fill="white" />
      <circle cx="22.06" cy="12.5" r="1.5" fill="white" />
      <circle cx="22.06" cy="19.5" r="1.5" fill="white" />
      <circle cx="16" cy="23" r="1.5" fill="white" />
      <circle cx="9.94" cy="19.5" r="1.5" fill="white" />
      <circle cx="9.94" cy="12.5" r="1.5" fill="white" />
    </svg>
  )
}

const brandIcons: Record<string, React.ReactNode> = {
  'Netflix': <NetflixIcon />,
  'Figma Pro': <FigmaIcon />,
  'Notion AI': <NotionIcon />,
  'GitHub Copilot': <GitHubIcon />,
  'Loom Pro': <LoomIcon />,
}

function ConfidenceBar({ value, tag }: { value: number; tag: string }) {
  const barColor = tag === 'UNDERUSED' ? '#E50914' : tag === 'REVIEW' ? '#D97706' : tag === 'ACTIVE' ? '#16A34A' : '#525252'
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1 flex-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
          viewport={{ once: true }}
          style={{ height: '100%', backgroundColor: barColor, borderRadius: '999px' }}
        />
      </div>
      <span
        className="text-secondary shrink-0"
        style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', width: '28px' }}
      >
        {value}%
      </span>
    </div>
  )
}

export default function IntelligencePreview() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px' })

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [8, -8]), { stiffness: 150, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-8, 8]), { stiffness: 150, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - (rect.left + rect.width / 2))
    mouseY.set(e.clientY - (rect.top + rect.height / 2))
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-32 overflow-hidden"
      style={{ backgroundColor: '#0D0D0D' }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p
            className="text-muted uppercase mb-4"
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.16em' }}
          >
            Intelligence layer
          </p>
          <h2
            className="text-white font-extrabold"
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(32px, 4vw, 52px)',
              letterSpacing: '-0.03em',
            }}
          >
            SAM sees what you miss.
          </h2>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ perspective: '1200px', cursor: 'default' }}
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d', maxWidth: '820px' }}
            className="rounded-sm overflow-hidden mx-auto"
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                backgroundColor: '#1C1C1C',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* macOS-style dots */}
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFBD2E' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28CA41' }} />
              <div
                className="flex-1 mx-3 px-3 py-1 rounded-sm text-muted text-center"
                style={{
                  backgroundColor: '#141414',
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '11px',
                  maxWidth: '220px',
                  margin: '0 auto',
                }}
              >
                sam.ciphergon.xyz/dashboard
              </div>
              {/* Live scanning badge */}
              <div className="flex items-center gap-1.5 ml-auto">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#E50914' }}
                />
                <span
                  className="text-muted"
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em' }}
                >
                  LIVE
                </span>
              </div>
            </div>

            {/* Dashboard content */}
            <div
              className="p-6"
              style={{
                backgroundColor: '#141414',
                backgroundImage: 'radial-gradient(rgba(229,9,20,0.03) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3
                    className="text-white font-bold"
                    style={{ fontFamily: 'var(--font-syne)', fontSize: '18px' }}
                  >
                    Subscriptions
                  </h3>
                  <p
                    className="text-muted"
                    style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}
                  >
                    5 detected · $69.49/mo total
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="px-3 py-1.5 text-white text-xs font-semibold"
                    style={{
                      backgroundColor: '#E50914',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-dm-mono)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    3 actions needed
                  </div>
                </div>
              </div>

              {/* Subscription rows */}
              <div>
                {mockSubs.map((sub, i) => (
                  <motion.div
                    key={sub.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.09 }}
                    className="flex items-center gap-4 py-3 px-2 rounded-sm"
                    style={{
                      borderBottom: i < mockSubs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      backgroundColor: sub.tag === 'UNDERUSED'
                        ? 'rgba(229,9,20,0.03)'
                        : sub.tag === 'REVIEW'
                        ? 'rgba(217,119,6,0.03)'
                        : 'transparent',
                    }}
                  >
                    {/* Brand icon */}
                    <div className="w-8 h-8 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                      {brandIcons[sub.name] ?? (
                        <div
                          className="w-8 h-8 flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: '#1C1C1C', color: '#E50914', fontFamily: 'var(--font-syne)' }}
                        >
                          {sub.name[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="text-white text-sm font-medium"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {sub.name}
                        </span>
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5"
                          style={{
                            color: tagColors[sub.tag],
                            border: `1px solid ${tagColors[sub.tag]}44`,
                            borderRadius: '2px',
                            fontFamily: 'var(--font-dm-mono)',
                            fontSize: '9px',
                            letterSpacing: '0.06em',
                            backgroundColor: `${tagColors[sub.tag]}0d`,
                          }}
                        >
                          {sub.tag}
                        </span>
                      </div>
                      <ConfidenceBar value={sub.confidence} tag={sub.tag} />
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className="text-white text-sm font-medium"
                        style={{ fontFamily: 'var(--font-dm-mono)' }}
                      >
                        {sub.amount}
                      </p>
                      <p
                        className="text-muted"
                        style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px' }}
                      >
                        {sub.cadence}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer bar */}
              <div
                className="flex items-center justify-between mt-4 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span
                  className="text-muted"
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px' }}
                >
                  SAM · confidence engine v0.1
                </span>
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1.5"
                >
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#16A34A' }} />
                  <span
                    className="text-muted"
                    style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px' }}
                  >
                    agent active
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
