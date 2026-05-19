/**
 * Deploy SAMPolicy to Celo mainnet
 * Run after: npm install viem in server/
 *
 *   AGENT_PRIVATE_KEY=0x... CELO_RPC=https://forno.celo.org npx tsx deploy-celo.ts
 */
import { createWalletClient, createPublicClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY as `0x${string}`
const CELO_RPC = process.env.CELO_RPC ?? 'https://forno.celo.org'

if (!AGENT_PRIVATE_KEY) throw new Error('AGENT_PRIVATE_KEY required')

const account = privateKeyToAccount(AGENT_PRIVATE_KEY)
console.log('Deployer / Agent:', account.address)

const walletClient = createWalletClient({ account, chain: celo, transport: http(CELO_RPC) })
const publicClient = createPublicClient({ chain: celo, transport: http(CELO_RPC) })

// Compile with solc before running
// solc --abi --bin SAMPolicy.sol -o ./out --overwrite
const abi = JSON.parse(readFileSync('./out/SAMPolicy.abi', 'utf8'))
const bytecode = ('0x' + readFileSync('./out/SAMPolicy.bin', 'utf8').trim()) as `0x${string}`

async function main() {
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [account.address], // samAgent = deployer address
  })

  console.log('Deploy tx:', hash)
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log('SAMPolicy deployed at:', receipt.contractAddress)
  console.log('Add to server/.env:')
  console.log(`SAM_POLICY_CONTRACT=${receipt.contractAddress}`)
}

main().catch(console.error)
