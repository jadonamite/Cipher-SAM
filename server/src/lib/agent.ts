import { createHmac, createHash, randomUUID } from 'node:crypto'

/**
 * SAM Agent wallet — server-side signing identity
 *
 * Current: HMAC-SHA256 attestation signatures (no external deps).
 * Upgrade path: install viem → replace signAttestation with:
 *   import { privateKeyToAccount } from 'viem/accounts'
 *   const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`)
 *   account.signMessage({ message: payload })
 *
 * AGENT_PRIVATE_KEY: generate with `openssl rand -hex 32`, prefix with 0x
 * AGENT_ADDRESS: derive with viem's privateKeyToAccount(key).address
 */

const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY ?? ''
const AGENT_ADDRESS     = process.env.AGENT_ADDRESS ?? '0x0000000000000000000000000000000000000000'
const POLICY_CONTRACT   = process.env.SAM_POLICY_CONTRACT ?? ''

export type AttestationPayload = {
  action_id: string
  subscription_id: string
  action_type: string
  user_privy_did: string
  timestamp: string
  agent: string
}

export function isAgentConfigured(): boolean {
  return !!AGENT_PRIVATE_KEY && AGENT_ADDRESS !== '0x0000000000000000000000000000000000000000'
}

export function getAgentAddress(): string {
  return AGENT_ADDRESS
}

export function getPolicyContract(): string {
  return POLICY_CONTRACT
}

// Deterministic attestation ID from action fields
export function buildAttestationId(subId: string, actionType: string, timestamp: string): string {
  return createHash('sha256')
    .update(`${subId}:${actionType}:${timestamp}`)
    .digest('hex')
    .slice(0, 32)
}

// HMAC-SHA256 signature over the canonical JSON payload
// Provides tamper-evident attestations without on-chain cost
// Replace with eth_sign via viem for EIP-191 Ethereum signatures
export function signAttestation(payload: AttestationPayload): string {
  if (!AGENT_PRIVATE_KEY) return 'unsigned:no_key'
  const canonical = JSON.stringify(payload, Object.keys(payload).sort())
  return 'hmac-sha256:' + createHmac('sha256', AGENT_PRIVATE_KEY).update(canonical).digest('hex')
}

export function buildAttestation(
  subscriptionId: string,
  actionType: string,
  userPrivyDid: string
): { payload: AttestationPayload; signature: string } {
  const timestamp = new Date().toISOString()
  const payload: AttestationPayload = {
    action_id:       randomUUID(),
    subscription_id: subscriptionId,
    action_type:     actionType,
    user_privy_did:  userPrivyDid,
    timestamp,
    agent:           AGENT_ADDRESS,
  }
  return { payload, signature: signAttestation(payload) }
}
