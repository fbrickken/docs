import assert from 'node:assert/strict';
import test from 'node:test';
import { Wallet } from 'ethers';
import {
  CHAIN_ID,
  createTokenSymbol,
  loadConfig,
  pollTransaction,
  run,
  type FetchLike,
} from '../src/index.js';

const PRIVATE_KEY = `0x${'11'.repeat(32)}`;
const WALLET = new Wallet(PRIVATE_KEY);
const TX_HASH = `0x${'ab'.repeat(32)}`;

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function config() {
  return {
    apiKey: 'sandbox-key',
    privateKey: PRIVATE_KEY,
    tokenizerEmail: 'issuer@example.com',
    baseUrl: 'https://api.sandbox.brickken.com',
    tokenSymbol: 'HW99',
  };
}

test('creates a token and verifies it after pending becomes success', async () => {
  const statuses = ['pending', 'success'];
  const calls: string[] = [];
  let sendBody: Record<string, unknown> | undefined;
  const fetchImpl: FetchLike = async (input, init) => {
    const url = String(input);
    calls.push(`${init?.method || 'GET'} ${url}`);
    if (url.endsWith('/prepare-transactions')) {
      return response({
        txId: 'prepared-1',
        transactions: [0, 1].map(nonce => ({
          from: WALLET.address,
          to: `0x${'22'.repeat(20)}`,
          nonce,
          chainId: Number(CHAIN_ID),
          gasLimit: '21000',
          maxFeePerGas: '1000000000',
          maxPriorityFeePerGas: '100000000',
          value: '0x0',
          data: '0x',
          type: 2,
        })),
      });
    }
    if (url.endsWith('/send-transactions')) {
      sendBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return response({ txHash: TX_HASH });
    }
    if (url.includes('/get-transaction-status')) return response({ status: statuses.shift() });
    if (url.endsWith('/get-token-info')) return response({ tokenSymbols: ['HW99'] });
    throw new Error(`Unexpected request: ${url}`);
  };

  const result = await run(config(), { fetchImpl, sleep: async () => undefined, pollIntervalMs: 0 });
  assert.equal(result.status, 'success');
  assert.equal(result.tokenSymbol, 'HW99');
  assert.equal(result.txHash, TX_HASH);
  assert.equal(sendBody?.txId, 'prepared-1');
  assert.equal((sendBody?.signedTransactions as string[]).length, 2);
  assert.ok(calls.some(call => call.includes('/prepare-transactions')));
  assert.ok(calls.some(call => call.includes('/get-token-info')));
});

test('fails when the transaction is rejected', async () => {
  const fetchImpl: FetchLike = async () => response({ status: 'rejected', error: 'reverted' });
  await assert.rejects(
    pollTransaction(config(), 'prepared-2', { fetchImpl, sleep: async () => undefined, pollAttempts: 1 }),
    /rejected: reverted/,
  );
});

test('fails when polling reaches its timeout', async () => {
  const fetchImpl: FetchLike = async () => response({ status: 'pending' });
  await assert.rejects(
    pollTransaction(config(), 'prepared-3', { fetchImpl, sleep: async () => undefined, pollAttempts: 2 }),
    /Timed out waiting for transaction prepared-3/,
  );
});

test('validates required configuration and creates a valid symbol', () => {
  assert.throws(() => loadConfig({}), /BRICKKEN_API_KEY is required/);
  const first = createTokenSymbol(1_700_000_000_000);
  const second = createTokenSymbol(1_700_000_000_000);
  assert.match(first, /^[A-Z0-9]{2,5}$/);
  assert.notEqual(first, second);
});
