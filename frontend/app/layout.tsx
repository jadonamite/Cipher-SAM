import type { Metadata } from 'next'
import { Syne, DM_Mono } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import PrivyProvider from '@/components/providers/PrivyProvider'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'SAM — Subscription Agentic Manager',
  description:
    'An autonomous AI system that understands and manages your recurring financial commitments across Web2 and Web3.',
  openGraph: {
    title: 'SAM — Subscription Agentic Manager',
    description: 'Your subscriptions are bleeding you.',
    siteName: 'SAM by Ciphergon',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmMono.variable} ${GeistSans.variable}`}
    >
      <body className="bg-void text-white antialiased">
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  )
}
