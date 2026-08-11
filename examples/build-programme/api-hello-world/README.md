# Brickken API Challenge — Hello World

This example creates one tokenized asset through the Brickken Dapp API and verifies it through the API read surface. It uses direct HTTP requests and local transaction signing; it does not use the Brickken SDK.

## Prerequisites

- Node.js 20 or newer.
- A sandbox API key with one `newTokenization` credit.
- A registered tokenizer email associated with that key.
- A signer wallet whitelisted by Brickken for the sandbox environment.
- Sepolia ETH in the signer wallet for native gas.

Never use a production key or a wallet holding real value for this example. The private key stays in the local process and is never sent to Brickken.

## Run

```bash
cp .env.example .env
# Edit .env with your sandbox values.
npm ci
npm start
```

The command generates a unique token symbol, prepares and signs the transaction locally, sends it through Brickken, polls until it succeeds, and verifies the symbol with `GET /get-token-info`.

## Checks

```bash
npm run check
```

The tests mock the HTTP layer and cover prepare/send, pending-to-success polling, rejection, timeout, and token readback.
