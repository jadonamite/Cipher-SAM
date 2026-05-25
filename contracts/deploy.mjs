/**
 * Deploy SAMPolicy to Celo mainnet
 *
 * Two modes:
 *   1. Deploy from your OWN wallet (recommended — agent wallet is empty):
 *      DEPLOYER_KEY=0x<your_key> node deploy.mjs
 *
 *   2. Deploy from agent wallet (if funded):
 *      node deploy.mjs
 *      (uses AGENT_PRIVATE_KEY from env — must have CELO for gas)
 *
 * Agent address is always set to: 0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0
 */

import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import solc from 'solc'
import { readFileSync } from 'fs'

const AGENT_ADDRESS = '0x3ea23aa1d53eb5209f014f02ca889a6a7b37eed0'
const CELO_RPC = 'https://forno.celo.org'

// Use DEPLOYER_KEY if provided, otherwise fall back to AGENT_PRIVATE_KEY
const PRIVATE_KEY = (process.env.DEPLOYER_KEY ?? process.env.AGENT_PRIVATE_KEY)
if (!PRIVATE_KEY) {
  console.error('Error: set DEPLOYER_KEY=0x<your_private_key> and retry')
  process.exit(1)
}

// Compile SAMPolicy.sol
console.log('Compiling SAMPolicy.sol...')
const source = readFileSync('./SAMPolicy.sol', 'utf8')
const input = {
  language: 'Solidity',
  sources: { 'SAMPolicy.sol': { content: source } },
  settings: {
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
    optimizer: { enabled: true, runs: 200 },
  },
}
const output = JSON.parse(solc.compile(JSON.stringify(input)))

if (output.errors?.some((e) => e.severity === 'error')) {
  console.error('Compile errors:', output.errors)
  process.exit(1)
}

const contract = output.contracts['SAMPolicy.sol']['SAMPolicy']
const abi = contract.abi
const bytecode = ('0x' + contract.evm.bytecode.object)

console.log('Compiled. Bytecode size:', bytecode.length / 2, 'bytes')

// Deploy
const account = privateKeyToAccount(PRIVATE_KEY)
console.log('Deploying from:', account.address)
console.log('SAM agent address:', AGENT_ADDRESS)

const walletClient = createWalletClient({
  account,
  chain: celo,
  transport: http(CELO_RPC),
})
const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC),
})

const balance = await publicClient.getBalance({ address: account.address })
console.log('Deployer CELO balance:', Number(balance) / 1e18)

if (balance === 0n) {
  console.error('Error: deployer wallet has 0 CELO. Send some CELO first.')
  process.exit(1)
}

const hash = await walletClient.deployContract({
  abi,
  bytecode,
  args: [AGENT_ADDRESS],
})

console.log('Deploy tx hash:', hash)
console.log('Waiting for confirmation...')

const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log('\n✅ SAMPolicy deployed!')
console.log('Contract address:', receipt.contractAddress)
console.log('\nAdd to Vercel env vars:')
console.log('SAM_POLICY_CONTRACT=' + receipt.contractAddress)
console.log('\nCeloscan:')
console.log('https://celoscan.io/address/' + receipt.contractAddress)
