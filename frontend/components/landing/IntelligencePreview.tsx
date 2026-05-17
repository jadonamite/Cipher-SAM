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
  KEEP: '#A3A3A3',
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-px flex-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          style={{ height: '100%', backgroundColor: '#E50914' }}
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
      className="py-32 overflow-hidden"
      style={{ backgroundColor: '#0D0D0D' }}
    >
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
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
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="rounded-sm overflow-hidden mx-auto"
            style={{ maxWidth: '820px' }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ backgroundColor: '#1C1C1C', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#525252' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#525252' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#525252' }} />
              <div
                className="flex-1 mx-4 px-3 py-1 rounded-sm text-muted text-center"
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
            </div>

            {/* Dashboard content */}
            <div
              className="p-6"
              style={{ backgroundColor: '#141414', maxWidth: '820px' }}
            >
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
                <div
                  className="px-3 py-1.5 text-white text-xs font-semibold"
                  style={{ backgroundColor: '#E50914', borderRadius: '2px', fontFamily: 'var(--font-geist-sans)' }}
                >
                  3 actions needed
                </div>
              </div>

              <div>
                {mockSubs.map((sub, i) => (
                  <motion.div
                    key={sub.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                    className="flex items-center gap-4 py-3"
                    style={{ borderBottom: i < mockSubs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  >
                    <div
                      className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: '#1C1C1C', color: '#E50914', fontFamily: 'var(--font-syne)' }}
                    >
                      {sub.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
                            border: `1px solid ${tagColors[sub.tag]}33`,
                            borderRadius: '2px',
                            fontFamily: 'var(--font-dm-mono)',
                            fontSize: '9px',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {sub.tag}
                        </span>
                      </div>
                      <ConfidenceBar value={sub.confidence} />
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-white text-sm"
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
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
