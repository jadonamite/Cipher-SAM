'use client'

import { PrivyProvider as Privy } from '@privy-io/react-auth'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''

const getPrivyConfig = () => ({
  appearance: {
    theme: 'dark',
    accentColor: '#E50914',
    logo: undefined,
  },
  loginMethods: ['email', 'wallet', 'google'],
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
})

const getPrivyProviderProps = (appId: string) => ({
  appId,
  config: getPrivyConfig(),
})

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Privy
      {...getPrivyProviderProps(PRIVY_APP_ID)}
    >
      {children}
    </Privy>
  )
}