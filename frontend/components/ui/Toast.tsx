'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/providers/ToastProvider'

const COLORS = {
  error: { border: 'rgba(229,9,20,0.35)', text: '#E50914', dot: '#E50914' },
  success: { border: 'rgba(22,163,74,0.35)', text: '#16A34A', dot: '#16A34A' },
  info: { border: 'rgba(255,255,255,0.12)', text: '#A3A3A3', dot: '#525252' },
}

const getToastColor = (toast) => {
  return toast ? COLORS[toast.type] : COLORS.info
}

const getToastStyle = (color) => ({
  position: 'fixed',
  top: '72px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 9999,
  minWidth: '280px',
  maxWidth: '480px',
  background: '#0f0f0f',
  border: `1px solid ${color.border}`,
  borderRadius: '3px',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
})

const getIndicatorStyle = (color) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: color.dot,
  flexShrink: 0,
})

const getMessageStyle = () => ({
  fontFamily: 'var(--font-geist-sans)',
  fontSize: '13px',
  color: '#E5E5E5',
  lineHeight: 1.4,
  flex: 1,
})

const getDismissButtonStyle = () => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#525252',
  padding: '0 2px',
  fontSize: '16px',
  lineHeight: 1,
  flexShrink: 0,
})

export default function Toast() {
  const { toast, dismiss } = useToast()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismiss, 4000)
    return () => clearTimeout(t)
  }, [toast, dismiss])
  const color = getToastColor(toast)
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={getToastStyle(color)}
        >
          {/* indicator dot */}
          <span style={getIndicatorStyle(color)} />
          {/* message */}
          <span style={getMessageStyle()}>
            {toast.message}
          </span>
          {/* dismiss */}
          <button onClick={dismiss} style={getDismissButtonStyle()}>
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}