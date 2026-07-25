export function detectMiniPay(): boolean {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  return window.ethereum.isMiniPay === true;
}