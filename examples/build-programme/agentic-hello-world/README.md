# Brickken Agentic Challenge — Hello World

This example uses the Brickken CLI and x402 on Base Sepolia to register an ERC-8004 agent and deploy an ERC-20 owned by the participant wallet.

## Prerequisites

- Node.js 18 or newer.
- `brickken-cli@0.4.13`, installed with `npm install -g brickken-cli@0.4.13`.
- `jq` and `curl`.
- A fresh Base Sepolia wallet whose address is set in `WALLET` and whose private key is set in `BRICKKEN_PRIVATE_KEY`.
- Base Sepolia Circle USDC for x402 payments and Base Sepolia ETH for client-signed gas.

Use the [Circle faucet](https://faucet.circle.com/) for USDC and the [official Base faucet list](https://docs.base.org/base-chain/network-information/network-faucets) for ETH. This example never needs a Brickken API key.

## Run

```bash
cp .env.example .env
# Edit .env. WALLET must correspond to BRICKKEN_PRIVATE_KEY.
./run.sh
```

The script explicitly uses `client-signed` mode. The CLI signs the x402 payment and the blockchain transaction locally, then Brickken broadcasts the signed operation. The live x402 quote supplies the payment asset, amount, recipient, and timeout; the script does not hardcode them.

The registration and token deployment JSON files are written to `out/`, which is ignored by git. They contain transaction hashes and settlement metadata, never the private key.
