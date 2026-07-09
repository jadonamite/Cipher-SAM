interface Window {
  ethereum?: {
    isMetaMask?: boolean
    isMiniPay?: boolean
    request: (params: { method: string; params?: unknown[] }) => Promise<unknown>
    on: (event: string, handler: (...params: unknown[]) => void) => void
    removeListener: (event: string, handler: (...params: unknown[]) => void) => void
  }
}
