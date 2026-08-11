import { randomBytes } from 'node:crypto';
import { Wallet, type TransactionRequest } from 'ethers';

export const DEFAULT_BASE_URL = 'https://api.sandbox.brickken.com';
export const CHAIN_ID = '11155111';
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_POLL_ATTEMPTS = 60;
const generatedSymbols = new Set<string>();

type JsonRecord = Record<string, unknown>;

export type ApiConfig = {
  apiKey: string;
  privateKey: string;
  tokenizerEmail: string;
  baseUrl?: string;
  tokenSymbol?: string;
};

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type RunDependencies = {
  fetchImpl?: FetchLike;
  sleep?: (milliseconds: number) => Promise<void>;
  pollIntervalMs?: number;
  pollAttempts?: number;
};

type PreparedResponse = {
  txId: string;
  transactions: TransactionRequest[];
};

type TransactionStatus = {
  status: string;
  error?: string;
};

type TokenInfo = {
  tokenSymbols?: string[];
  tokenizerEmails?: string[];
  [key: string]: unknown;
};

function requireValue(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`${name} is required. Set it in .env or the environment.`);
  }
  return value.trim();
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    apiKey: requireValue('BRICKKEN_API_KEY', environment.BRICKKEN_API_KEY),
    privateKey: requireValue('BRICKKEN_PRIVATE_KEY', environment.BRICKKEN_PRIVATE_KEY),
    tokenizerEmail: requireValue('BRICKKEN_TOKENIZER_EMAIL', environment.BRICKKEN_TOKENIZER_EMAIL),
    baseUrl: environment.BRICKKEN_BASE_URL?.trim() || DEFAULT_BASE_URL,
  };
}

export function createTokenSymbol(now = Date.now()): string {
  const timePart = now.toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
  while (true) {
    const randomPart = randomBytes(2).toString('hex').toUpperCase().slice(0, 3);
    const symbol = `H${timePart}${randomPart}`;
    if (!generatedSymbols.has(symbol)) {
      generatedSymbols.add(symbol);
      return symbol;
    }
  }
}

function errorMessage(body: unknown): string {
  if (typeof body === 'string') return body;
  if (!body || typeof body !== 'object') return 'Unknown API error';

  const record = body as JsonRecord;
  const nested = record.error;
  if (typeof nested === 'string') return nested;
  if (nested && typeof nested === 'object' && typeof (nested as JsonRecord).message === 'string') {
    return String((nested as JsonRecord).message);
  }
  if (typeof record.message === 'string') return record.message;
  return JSON.stringify(body);
}

async function requestJson<T>(
  config: ApiConfig,
  path: string,
  init: RequestInit,
  fetchImpl: FetchLike,
): Promise<T> {
  const response = await fetchImpl(`${(config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    // Keep the raw response for a useful error message.
  }

  if (!response.ok) {
    throw new Error(`Brickken ${init.method || 'GET'} ${path} failed (${response.status}): ${errorMessage(body)}`);
  }
  return body as T;
}

function findTransactionHash(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as JsonRecord;
  if (typeof record.txHash === 'string') return record.txHash;
  if (typeof record.hash === 'string') return record.hash;
  if (Array.isArray(record.results)) {
    for (const result of record.results) {
      const hash = findTransactionHash(result);
      if (hash) return hash;
    }
  }
  if (Array.isArray(record.txResponses)) {
    for (const result of record.txResponses) {
      const hash = findTransactionHash(result);
      if (hash) return hash;
    }
  }
  if (record.result) return findTransactionHash(record.result);
  return undefined;
}

export async function pollTransaction(
  config: ApiConfig,
  txId: string,
  dependencies: Pick<RunDependencies, 'fetchImpl' | 'sleep' | 'pollIntervalMs' | 'pollAttempts'> = {},
): Promise<TransactionStatus> {
  const fetchImpl = dependencies.fetchImpl || fetch;
  const sleep = dependencies.sleep || ((milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds)));
  const pollIntervalMs = dependencies.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const pollAttempts = dependencies.pollAttempts ?? DEFAULT_POLL_ATTEMPTS;

  for (let attempt = 0; attempt < pollAttempts; attempt += 1) {
    const result = await requestJson<TransactionStatus>(
      config,
      `/get-transaction-status?txId=${encodeURIComponent(txId)}`,
      { method: 'GET' },
      fetchImpl,
    );
    const status = result.status.toLowerCase();
    if (status === 'success') return result;
    if (['failed', 'rejected', 'reverted', 'error'].includes(status)) {
      throw new Error(`Transaction ${txId} was ${status}: ${result.error || 'no error supplied'}`);
    }
    if (attempt < pollAttempts - 1) await sleep(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for transaction ${txId} after ${pollAttempts} status checks`);
}

export async function run(config: ApiConfig, dependencies: RunDependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || fetch;
  const wallet = new Wallet(config.privateKey);
  const tokenSymbol = config.tokenSymbol || createTokenSymbol();
  const prepareBody = {
    method: 'newTokenization',
    chainId: CHAIN_ID,
    tokenizerEmail: config.tokenizerEmail,
    signerAddress: wallet.address,
    name: `Hello World Asset ${tokenSymbol}`,
    tokenSymbol,
    tokenType: 'RWA_TOKEN',
    supplyCap: '1000000',
    url: 'https://docs.brickken.com/get-started/build-programme/api-hello-world',
  };

  const prepared = await requestJson<PreparedResponse>(
    config,
    '/prepare-transactions',
    { method: 'POST', body: JSON.stringify(prepareBody) },
    fetchImpl,
  );
  if (!prepared.txId || !Array.isArray(prepared.transactions) || prepared.transactions.length === 0) {
    throw new Error('Prepare returned no txId or unsigned transactions');
  }

  const signedTransactions = await Promise.all(
    prepared.transactions.map(transaction => wallet.signTransaction(transaction)),
  );
  const sent = await requestJson<JsonRecord>(
    config,
    '/send-transactions',
    {
      method: 'POST',
      body: JSON.stringify({ txId: prepared.txId, signedTransactions }),
    },
    fetchImpl,
  );
  const status = await pollTransaction(config, prepared.txId, dependencies);
  const tokenInfo = await requestJson<TokenInfo>(config, '/get-token-info', { method: 'GET' }, fetchImpl);
  if (!tokenInfo.tokenSymbols?.includes(tokenSymbol)) {
    throw new Error(`Token ${tokenSymbol} was confirmed but is missing from GET /get-token-info`);
  }

  return {
    chainId: CHAIN_ID,
    signerAddress: wallet.address,
    tokenSymbol,
    txId: prepared.txId,
    txHash: findTransactionHash(sent),
    status: status.status,
    tokenInfo,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run(loadConfig())
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
