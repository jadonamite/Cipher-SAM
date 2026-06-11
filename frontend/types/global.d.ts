interface Window {
  ethereum?: {
    isMetaMask?: boolean
    isMiniPay?: boolean
    // TODO: add error boundary here
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    on: (event: string, handler: (...args: unknown[]) => void) => void
    removeListener: (event: string, handler: (...args: unknown[]) => void) => void
  }
}
