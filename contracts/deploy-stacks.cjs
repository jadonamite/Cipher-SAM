'use strict';

// deploy-stacks.cjs
// Deploy sam-policy.clar to Stacks Mainnet
//
// Usage:
//   node deploy-stacks.cjs
//   node deploy-stacks.cjs --testnet
//   STACKS_MASTER_1_PRIVATE_KEY=<key> node deploy-stacks.cjs
//
// Reads STACKS_MASTER_1_PRIVATE_KEY from:
//   1. Environment variable
//   2. ../../Scripts/.env   (relative to this file)

const { readFileSync, existsSync } = require('fs');
const { resolve, join }            = require('path');

const {
  makeContractDeploy,
  broadcastTransaction,
  getAddressFromPrivateKey,
  AnchorMode,
  PostConditionMode,
  ClarityVersion,
  serializeTransaction,
} = require('@stacks/transactions');

const { STACKS_MAINNET, STACKS_TESTNET, clientFromNetwork } = require('@stacks/network');

// ── Network ───────────────────────────────────────────────────────────────────

const IS_TESTNET    = process.argv.includes('--testnet');
const network       = IS_TESTNET ? STACKS_TESTNET : STACKS_MAINNET;
const client        = clientFromNetwork(network);
const CONTRACT_NAME = 'sam-policy-v2';
const HIRO_API      = IS_TESTNET
  ? 'https://api.testnet.hiro.so'
  : 'https://api.mainnet.hiro.so';

// ── Key loading ───────────────────────────────────────────────────────────────

function loadKey() {
  if (process.env.STACKS_MASTER_2_PRIVATE_KEY) {
    return process.env.STACKS_MASTER_2_PRIVATE_KEY.trim();
  }
  const envPath = resolve(__dirname, '../../Scripts/.env');
  if (!existsSync(envPath)) throw new Error(`No key in env and .env not found at ${envPath}`);
  const raw = readFileSync(envPath, 'utf-8');
  const m   = raw.match(/^STACKS_MASTER_2_PRIVATE_KEY=(.+)$/m);
  if (!m) throw new Error('STACKS_MASTER_2_PRIVATE_KEY not found in Scripts/.env');
  return m[1].trim();
}

// ── Confirmation polling ──────────────────────────────────────────────────────

async function waitForTx(txid, timeoutMs = 300_000) {
  const url      = `${HIRO_API}/extended/v1/tx/${txid}`;
  const deadline = Date.now() + timeoutMs;
  process.stdout.write('  Waiting for confirmation');
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 5000));
    process.stdout.write('.');
    try {
      const res  = await fetch(url);
      const data = await res.json();
      if (data?.tx_status === 'success') { console.log(' ✅'); return true; }
      if (data?.tx_status === 'abort_by_response' || data?.tx_status === 'abort_by_post_condition') {
        console.log(` ❌ ${data.tx_status}`);
        return false;
      }
    } catch { /* keep polling */ }
  }
  console.log(' ⏱ timed out');
  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const senderKey     = loadKey();
  const deployerAddr  = getAddressFromPrivateKey(senderKey, network.version);
  const clarityCode   = readFileSync(resolve(__dirname, 'sam-policy.clar'), 'utf-8');
  const contractId    = `${deployerAddr}.${CONTRACT_NAME}`;

  console.log('\n══════════════════════════════════════════════════');
  console.log('  sam-policy.clar — Stacks Deploy');
  console.log(`  Network  : ${IS_TESTNET ? 'testnet' : 'mainnet'}`);
  console.log(`  Deployer : ${deployerAddr}`);
  console.log(`  Contract : ${contractId}`);
  console.log('══════════════════════════════════════════════════\n');

  // Check if already deployed
  try {
    const res  = await fetch(`${HIRO_API}/v2/contracts/interface/${deployerAddr}/${CONTRACT_NAME}`);
    if (res.ok) {
      console.log('⚠️  Contract already exists at this address.');
      console.log(`   ${contractId}`);
      console.log('   Use --testnet to deploy to testnet, or rename the contract.\n');
      process.exit(0);
    }
  } catch { /* not yet deployed — proceed */ }

  console.log('Building deploy transaction…');
  const tx = await makeContractDeploy({
    contractName:      CONTRACT_NAME,
    codeBody:          clarityCode,
    senderKey,
    network,
    client,
    fee:               300_000n,   // 0.3 STX — safe for an ~11KB contract deploy
    clarityVersion:    ClarityVersion.Clarity3,   // Clarity 3 — epoch 3 / Nakamoto
    anchorMode:        AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
  });

  // SDK v7 returns hex string from serializeTransaction — broadcast as binary
  const binary = Buffer.from(serializeTransaction(tx), 'hex');
  console.log(`TX size: ${binary.length} bytes — Broadcasting…`);
  const res = await fetch(`${HIRO_API}/v2/transactions`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body:    binary,
  });
  const text = await res.text();

  let result;
  try { result = JSON.parse(text); } catch { result = { error: text }; }

  if (res.status !== 200) {
    console.error(`\n❌ Broadcast failed (${res.status}): ${result.reason ?? result.error ?? text}`);
    if (result.reason_data) console.error('   Detail:', JSON.stringify(result.reason_data));
    process.exit(1);
  }

  const txid = typeof result === 'string' ? result : result.txid;

  console.log(`\nTx ID: ${txid}`);
  console.log(`Hiro:  ${HIRO_API.replace('api', 'explorer')}/txid/${txid}\n`);

  const confirmed = await waitForTx(txid);

  if (confirmed) {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  ✅ Deployed successfully');
    console.log(`  Contract ID : ${contractId}`);
    console.log(`  Explorer    : https://explorer.hiro.so/txid/${txid}?chain=${IS_TESTNET ? 'testnet' : 'mainnet'}`);
    console.log('');
    console.log('  Add to Cipher-SAM server/.env:');
    console.log(`  SAM_POLICY_STACKS=${contractId}`);
    console.log('══════════════════════════════════════════════════\n');
  }
}

main().catch(err => {
  console.error(`\n💀 Fatal: ${err.message}`);
  process.exit(1);
});
