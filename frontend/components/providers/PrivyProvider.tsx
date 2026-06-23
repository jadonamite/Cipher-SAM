'use client'

import { PrivyProvider as Privy } from '@privy-io/react-auth'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Privy
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#E50914',
          logo: undefined,
        },
        loginMethods: ['email', 'wallet', 'google'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </Privy>
  )
}
