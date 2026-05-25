/**
 * Register SAM agent in the ERC-8004 IdentityRegistry on Celo mainnet.
 *
 * What this does:
 *   1. Calls register(agentURI) on the ERC-8004 IdentityRegistry
 *   2. Mints an ERC-721 NFT — the agentId is SAM's permanent onchain identity
 *   3. Prints the 8004scan.me link and the agentId
 *
 * Run:
 *   cd ~/Projects/Cipher-SAM/contracts
 *   AGENT_PRIVATE_KEY=<from server/.env> node register-8004.mjs
 *
 * Real contract addresses (Celo mainnet, verified):
 *   IdentityRegistry:   0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
 *   ReputationRegistry: 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
 */

import { createWalletClient, createPublicClient, http, parseEventLogs } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
const AGENT_URI = 'https://ciphergon.vercel.app/.well-known/agent-registration.json'

const IDENTITY_REGISTRY_ABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const

const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY
if (!PRIVATE_KEY) {
  console.error('Error: set AGENT_PRIVATE_KEY env var')
  process.exit(1)
}

const account = privateKeyToAccount(PRIVATE_KEY)
const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') })
const walletClient = createWalletClient({ account, chain: celo, transport: http('https://forno.celo.org') })

async function main() {
  console.log('Agent wallet:', account.address)

  const balance = await publicClient.getBalance({ address: account.address })
  console.log('CELO balance:', Number(balance) / 1e18)

  // Simulate first to catch errors before sending
  console.log('\nSimulating register()...')
  const { request } = await publicClient.simulateContract({
    account,
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: 'register',
    args: [AGENT_URI],
  })

  console.log('Simulation passed. Sending transaction...')
  const hash = await walletClient.writeContract(request)
  console.log('Tx hash:', hash)

  console.log('Waiting for confirmation...')
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log('Confirmed in block', receipt.blockNumber)

  // Extract agentId from Transfer event (ERC-721 mint)
  const logs = parseEventLogs({
    abi: IDENTITY_REGISTRY_ABI,
    logs: receipt.logs,
    eventName: 'Transfer',
  })
  const agentId = logs[0]?.args?.tokenId ?? 'unknown'

  console.log('\n✅ SAM registered in ERC-8004 IdentityRegistry!')
  console.log('Agent ID (NFT token):', agentId.toString())
  console.log('Agent URI:', AGENT_URI)
  console.log('\n8004scan link:')
  console.log(`https://8004scan.me/agent/${account.address}`)
  console.log('\nCeloscan tx:')
  console.log(`https://celoscan.io/tx/${hash}`)
  console.log('\nUpdate agent-registration.json — set agentId to:', agentId.toString())
}

main().catch((err) => {
  console.error('Registration failed:', err.shortMessage ?? err.message)
  process.exit(1)
})
