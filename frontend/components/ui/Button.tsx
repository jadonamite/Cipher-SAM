'use client'

import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  const sizeClasses = {
    sm: 'px-5 py-2 text-sm',
    md: 'px-7 py-3 text-sm',
    lg: 'px-10 py-4 text-base',
  }
  return sizeClasses[size]
}

const getVariantStyles = (variant: 'primary' | 'secondary') => {
  return variant === 'primary'
    ? { backgroundColor: '#E50914', color: '#fff', border: 'none' }
    : {
        backgroundColor: 'transparent',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.15)',
      }
}

const getFontSize = (size: 'sm' | 'md' | 'lg') => {
  return size === 'sm' ? '11px' : size === 'lg' ? '13px' : '12px'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, filter: variant === 'primary' ? 'brightness(1.1)' : 'none' }}
      whileTap={{ scale: 0.98 }}
      className={`font-semibold uppercase tracking-wider cursor-pointer ${getSizeClasses(size)} ${className}`}
      style={{
        ...getVariantStyles(variant),
        fontFamily: 'var(--font-geist-sans)',
        letterSpacing: '0.08em',
        fontSize: getFontSize(size),
        borderRadius: '2px',
        transition: 'border-color 0.2s',
      }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
