'use client'

import { motion } from 'framer-motion'
import { usePrivy } from '@privy-io/react-auth'

interface ConnectGmailProps {
  onConnected?: () => void
  compact?: boolean
}

export default function ConnectGmail({ compact = false }: ConnectGmailProps) {
  const { user } = usePrivy()

  function handleConnect() {
    if (!user?.id) return
    window.location.href = `/api/gmail/auth?user_id=${user.id}`
  }

  if (compact) {
    return (
      <motion.button
        onClick={handleConnect}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest cursor-pointer"
        style={{
          fontFamily: 'var(--font-geist-sans)',
          background: '#E50914',
          color: '#fff',
          borderRadius: '2px',
          letterSpacing: '0.08em',
        }}
      >
        Connect Gmail
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6 py-16 px-8"
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '4px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <div
        className="w-12 h-12 flex items-center justify-center"
        style={{ background: 'rgba(229,9,20,0.1)', borderRadius: '2px' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z"
            stroke="#E50914"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M22 6L12 13L2 6" stroke="#E50914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="text-center flex flex-col gap-2">
        <h3
          className="text-xl font-bold text-white"
          style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.02em' }}
        >
          Connect Gmail
        </h3>
        <p style={{ fontFamily: 'var(--font-geist-sans)', color: '#A3A3A3' }} className="text-sm leading-relaxed">
          SAM reads your inbox to detect recurring subscriptions.
          <br />
          Read-only access. SAM cannot send or delete emails.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {['Read-only Gmail access', 'Detected in under 30 seconds', 'No manual entry required'].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className="w-1 h-1 rounded-full" style={{ background: '#E50914', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252' }} className="text-xs">
              {item}
            </span>
          </div>
        ))}
      </div>

      <motion.button
        onClick={handleConnect}
        whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 text-sm font-semibold uppercase tracking-widest cursor-pointer"
        style={{
          fontFamily: 'var(--font-geist-sans)',
          background: '#E50914',
          color: '#fff',
          borderRadius: '2px',
          letterSpacing: '0.08em',
        }}
      >
        Connect & Scan Gmail
      </motion.button>

      <p style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252' }} className="text-[10px] text-center">
        You will be redirected to Google's secure sign-in page
      </p>
    </motion.div>
  )
}
