'use client'

import { PrivyProvider as Privy } from '@privy-io/react-auth'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''

const getPrivyAppearance = () => ({
  theme: 'dark',
  accentColor: '#E50914',
  logo: undefined,
})

const getPrivyLoginMethods = () => ['email', 'wallet', 'google']

const getPrivyEmbeddedWallets = () => ({
  createOnLogin: 'users-without-wallets',
})

const getPrivyConfig = () => ({
  appearance: getPrivyAppearance(),
  loginMethods: getPrivyLoginMethods(),
  embeddedWallets: getPrivyEmbeddedWallets(),
})

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Privy
      appId={PRIVY_APP_ID}
      config={getPrivyConfig()}
    >
      {children}
    </Privy>
  )
}