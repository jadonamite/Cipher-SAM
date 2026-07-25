export function detectMiniPay(): boolean {
  return typeof window !== 'undefined' && window.ethereum?.isMiniPay === true;
}