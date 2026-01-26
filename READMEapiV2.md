# Brickken API V2 Documentation

## Overview

The Brickken API V2 provides a comprehensive interface for tokenizing real-world assets on the blockchain. This updated version includes streamlined endpoints, new transaction methods, and enhanced "on behalf" functionality for managing tokenization workflows.

### Key Changes in V2

- **Simplified Endpoints**: Removed "-api" suffix from all endpoints (e.g., `prepare-api-transactions` → `prepare-transactions`)
- **New Transaction Methods**: Added `newSto`, `newInvest`, `claimTokens`, and `closeOffer`
- **Unified Send Transactions**: The `send-transactions` endpoint now accepts signed transactions and `txId` for all transaction types
- **On Behalf Endpoints**: Three new endpoints for performing actions on behalf of users:
  - `create-token-on-behalf`: Create tokens on behalf of tokenizers
  - `invest-on-behalf`: Make investments on behalf of investors
  - `sto-claim-on-behalf`: Claim tokens on behalf of investors

## Authentication

All API requests require authentication using an API key provided in the request headers.

```http
x-api-key: your-api-key-here
```

## Supported Networks

The API supports multiple blockchain networks. Specify the network using the `chainId` parameter:

In sandbox environment:

```
Sepolia testnet:
Chain Id: "aa36a7"

Polygon Amoy testnet:
Chain Id: "13882"
```

In production environment:

```
Ethereum mainnet:
Chain Id: "1"

Base mainnet:
Chain Id: "2105"

BNB Smart Chain Mainnet:
Chain Id: "38"

Polygon mainnet:
Chain Id: "89"
```

## API Workflow

The typical workflow involves three steps:

1. **Prepare**: Use `POST /prepare-transactions` to prepare unsigned transactions
2. **Sign**: Sign the returned transactions using your preferred wallet/signing method
3. **Send**: Submit signed transactions using `POST /send-transactions`

### On Behalf Workflow

1. **Create Token on Behalf**: Use `POST /create-token-on-behalf` to create tokens on behalf of tokenizers
2. **Invest on Behalf**: Use `POST /invest-on-behalf` to make investments on behalf of investors
3. **Claim Tokens on Behalf**: Use `POST /sto-claim-on-behalf` to claim tokens on behalf of investors

## Environments

- **Sandbox**: `https://api-sandbox.brickken.com`
- **Production**: `https://api.brickken.com`

---

## Endpoints

### POST /prepare-transactions

Prepares unsigned transactions for various blockchain operations.

#### Common Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainId` | string | Yes | Blockchain network identifier |
| `method` | string | Yes | Transaction method type |

#### Method: `newTokenization`

Creates a new tokenized asset.

**Additional Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenizerEmail` | string | Yes | Email of the tokenizer |
| `url` | string | Yes | URL for token documentation |
| `name` | string | Yes | Name of the token |
| `tokenSymbol` | string | Yes | Token symbol (max 5 characters) |
| `tokenType` | string | Yes | Type of token. Allowed values: EQUITY, DEBT, PRIVATE_CREDIT, FUNDS, RWA_TOKEN, PROFIT_SHARING |
| `supplyCap` | string | No | Maximum token supply cap |
| `preMints` | array | No | Pre-mint configurations |
| `initialHolders` | array | No | Initial holder configurations |

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "newTokenization",
  "tokenizerEmail": "tokenizer@example.com",
  "url": "https://example.com/token-docs",
  "name": "Example Token",
  "tokenSymbol": "EXMPL",
  "tokenType": "EQUITY",
  "supplyCap": "1000000",
  "preMints": [
    {
      "email": "holder@example.com",
      "investorAddress": "0x123...",
      "amount": "1000",
      "needWhitelist": true
    }
  ],
  "initialHolders": [
    {
      "email": "holder@example.com",
      "percentage": 10
    }
  ]
}
```

#### Method: `newSto`

Creates a new Security Token Offering.

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "newSto",
  "tokenSymbol": "EXMPL",
  "paymentTokenAddress": "0x456...",
  "price": "100",
  "minInvestment": "10",
  "maxInvestment": "10000",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "softCap": "50000",
  "hardCap": "500000"
}
```

#### Method: `newInvest`

Makes an investment in an STO.

**Request Body:**
```json
{
  "chainId": "0x89",
  "investorAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "newInvest",
  "tokenSymbol": "EXMPL",
  "investorEmail": "investor@example.com",
  "amount": "1000"
}
```

#### Method: `claimTokens`

Claims tokens from a completed STO.

**Request Body:**
```json
{
  "chainId": "0x89",
  "investorAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "claimTokens",
  "tokenSymbol": "EXMPL",
  "investorEmail": "investor@example.com"
}
```

#### Method: `closeOffer`

Closes an active STO.

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "closeOffer",
  "tokenSymbol": "EXMPL"
}
```

#### Method: `mintToken`

Mints additional tokens to specified addresses.

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "mintToken",
  "tokenSymbol": "EXMPL",
  "userToMint": [
    {
      "investorEmail": "user@example.com",
      "investorAddress": "0x789...",
      "amount": "500",
      "needWhitelist": true
    }
  ]
}
```

#### Method: `whitelist`

Manages whitelist status for addresses.

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "whitelist",
  "tokenSymbol": "EXMPL",
  "userToWhitelist": [
    {
      "whitelistStatus": "true",
      "investorAddress": "0x789..."
    }
  ]
}
```

#### Method: `burnToken`

Burns tokens from the signer's address.

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "burnToken",
  "tokenSymbol": "EXMPL",
  "amount": "100"
}
```

#### Method: `transferFrom`

Transfers tokens from one address to another (requires approval).

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "transferFrom",
  "tokenSymbol": "EXMPL",
  "from": "0x123...",
  "to": "0x456...",
  "amount": "50"
}
```

#### Method: `transferTo`

Transfers tokens from signer's address to another address.

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "transferTo",
  "tokenSymbol": "EXMPL",
  "to": "0x456...",
  "amount": "50"
}
```

#### Method: `approve`

Approves another address to spend tokens on behalf of the signer.

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "approve",
  "tokenSymbol": "EXMPL",
  "spenderAddress": "0x456...",
  "amount": "100"
}
```

#### Method: `dividendDistribution`

Distributes dividends to token holders.

**Request Body:**
```json
{
  "chainId": "0x89",
  "signerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "dividendDistribution",
  "tokenSymbol": "EXMPL",
  "amount": "1000"
}
```

**Response:**
```json
{
  "txId": "tx_abc123def456",
  "transactions": [
    {
      "to": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
      "data": "0x...",
      "value": "0",
      "gasLimit": "500000",
      "maxFeePerGas": "20000000000",
      "maxPriorityFeePerGas": "2000000000",
      "nonce": 42,
      "type": 2,
      "chainId": "0x89"
    }
  ]
}
```

---

### POST /send-transactions

Submits signed transactions to the blockchain. This endpoint now works uniformly for all transaction types.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `signedTransactions` | string \| string[] | Yes | Signed transaction hex string(s) starting with `0x`. Can be a single string (legacy) or an array of strings |
| `txId` | string \| string[] | Yes | Transaction ID(s) from prepare-transactions response. Must match the format of `signedTransactions` (both strings or both arrays) |

> **Important:** `signedTransactions` must be a hex string (starting with `0x`), **not** an object or array of objects. Both `txId` and `signedTransactions` must use the same format.

**Request Body (Legacy Format - Single String):**
```json
{
  "signedTransactions": "0x02f8b1018203e8843b9aca00850ba43b740082520894742d35cc6634c0532925a3b8d4c9db96c4b4d8b80b844a9059cbb000000000000000000000000456789abcdef...",
  "txId": "0x11769b5c2028a8ed0a3bdc7599e244aee68e2cae80261d8954e44c3b5cb621a4"
}
```

**Request Body (Array Format):**
```json
{
  "signedTransactions": [
    "0x02f8b1018203e8843b9aca00850ba43b740082520894742d35cc6634c0532925a3b8d4c9db96c4b4d8b80b844a9059cbb000000000000000000000000456789abcdef..."
  ],
  "txId": [
    "0x11769b5c2028a8ed0a3bdc7599e244aee68e2cae80261d8954e44c3b5cb621a4"
  ]
}
```

**Response:**
```json
{
  "txHash": "0x1234567890abcdef...",
  "status": "pending"
}
```

---

## On Behalf Endpoints

### POST /create-token-on-behalf

Creates a new tokenization on behalf of a tokenizer.

**Request Body:**
```json
{
  "tokenizerEmail": "tokenizer@example.com",
  "tokenizerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "chainId": "0x89",
  "name": "Example Token",
  "tokenSymbol": "EXMPL",
  "tokenType": "EQUITY",
  "supplyCap": "1000000",
  "preMints": [
    {
      "email": "holder@example.com",
      "investorAddress": "0x123...",
      "amount": "1000",
      "needWhitelist": true
    }
  ],
  "initialHolders": [
    {
      "email": "holder@example.com",
      "percentage": 10
    }
  ]
}
```

### POST /invest-on-behalf

Makes an investment on behalf of an investor.

**Request Body:**
```json
{
  "chainId": "0x89",
  "investorAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "newInvest",
  "tokenSymbol": "EXMPL",
  "investorEmail": "investor@example.com",
  "amount": "1000"
}
```

### POST /sto-claim-on-behalf

Claims tokens on behalf of an investor.

**Request Body:**
```json
{
  "chainId": "0x89",
  "investorAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "method": "claimTokens",
  "tokenSymbol": "EXMPL",
  "investorEmail": "investor@example.com"
}
```

---

## GET Endpoints

### GET /get-transaction-status

Retrieves the status of a transaction.

**Query Parameters:**
- `hash` (required): Transaction hash

**Example:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-transaction-status?hash=0x46f7114878c49ad5af0f1e6f0a2ce9c700c1fdf36455fd956b20f492ee813e80' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Response:**
```json
{
  "status": "success",
  "txHash": "0x1234567890abcdef...",
  "blockNumber": 12345678,
  "gasUsed": "150000"
}
```

### GET /get-allowance

Retrieves the allowance amount for a spender.

**Query Parameters:**
- `tokenSymbol` (required): Token symbol
- `ownerAddress` (required): Token owner address
- `spenderAddress` (required): Spender address
- `chainId` (required): Blockchain network ID

**Example:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-allowance?tokenSymbol=EXMPL&ownerAddress=0x123...&spenderAddress=0x456...&chainId=0x89' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Response:**
```json
{
  "allowance": "1000000000000000000"
}
```

### GET /get-balance-whitelist

Retrieves token balance and whitelist status for an address.

**Query Parameters:**
- `tokenSymbol` (required): Token symbol
- `address` (required): Wallet address
- `chainId` (required): Blockchain network ID

**Example:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-balance-whitelist?tokenSymbol=EXMPL&address=0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b&chainId=0x89' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Response:**
```json
{
  "balance": "500000000000000000",
  "isWhitelisted": true
}
```

### GET /get-network-info

Retrieves information about supported networks.

**Query Parameters:**
- `chainId` (optional): Specific chain ID

**Example:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-network-info?chainId=0x89' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Response:**
```json
{
  "networks": [
    {
      "chainId": "0x89",
      "name": "Polygon",
      "rpcUrl": "https://polygon-rpc.com",
      "blockExplorer": "https://polygonscan.com"
    }
  ]
}
```

### GET /get-token-info

Retrieves detailed information about a token.

**Query Parameters:**
- `tokenSymbol` (required): Token symbol
- `chainId` (required): Blockchain network ID

**Example:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-token-info?tokenSymbol=EXMPL&chainId=0x89' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Response:**
```json
{
  "name": "Example Token",
  "symbol": "EXMPL",
  "totalSupply": "1000000000000000000000",
  "decimals": 18,
  "contractAddress": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"
}
```

### GET /get-tokenizer-info

Retrieves information about a tokenizer.

**Query Parameters:**
- `tokenizerEmail` (required): Tokenizer email address

**Example:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-tokenizer-info?tokenizerEmail=tokenizer@example.com' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Response:**
```json
{
  "email": "tokenizer@example.com",
  "companyName": "Example Corp",
  "tokens": [
    {
      "symbol": "EXMPL",
      "name": "Example Token",
      "chainId": "0x89"
    }
  ]
}
```

### GET /get-whitelist-status

Checks if an address is whitelisted for a specific token.

**Query Parameters:**
- `tokenSymbol` (required): Token symbol
- `address` (required): Wallet address to check
- `chainId` (required): Blockchain network ID

**Example:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-whitelist-status?tokenSymbol=EXMPL&address=0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b&chainId=0x89' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Response:**
```json
{
  "isWhitelisted": true,
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "tokenSymbol": "EXMPL"
}
```

### GET /get-stos

Retrieves information about Security Token Offerings (STOs).

**Query Parameters:**
- `tokenSymbol` (optional): Filter by specific token symbol
- `id` (optional): Get specific STO by ID
- `chainId` (required): Blockchain network ID

**Example - Get all STOs:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-stos?chainId=0x89' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Example - Get specific STO by ID:**
```bash
curl --request GET \
  --url 'https://api.sandbox.brickken.com/get-stos?id=123&chainId=0x89' \
  --header 'x-api-key: YOUR_API_KEY'
```

**Response:**
```json
{
  "stos": [
    {
      "id": "123",
      "tokenSymbol": "EXMPL",
      "status": "active",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z",
      "softCap": "50000",
      "hardCap": "500000",
      "raised": "25000"
    }
  ]
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "The chainId parameter is required",
    "details": {
      "parameter": "chainId",
      "expected": "string",
      "received": "undefined"
    }
  }
}
```

---

## Security Considerations

### API Key Protection
- Store API keys securely and never expose them in client-side code
- Use environment variables or secure key management systems
- Rotate API keys regularly

### Transaction Signing
- Always verify transaction details before signing
- Use hardware wallets or secure signing methods for production
- Validate all transaction parameters

### Network Security
- Use HTTPS for all API communications
- Implement proper rate limiting
- Monitor for unusual activity patterns

---

## Known Issues

- Transaction confirmation times may vary based on network congestion
- Some networks may have higher gas requirements during peak usage
- Rate limits apply to prevent abuse (contact support for higher limits)

---

## Support

For technical support or questions:

- **Documentation**: https://docs.brickken.com

---

*Last updated: August 2025*
*API Version: 2.0*