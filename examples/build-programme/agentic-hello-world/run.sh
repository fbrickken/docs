#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${BRICKKEN_PRIVATE_KEY:?Set BRICKKEN_PRIVATE_KEY to a Base Sepolia testnet-only key}"
: "${BRICKKEN_RPC_URL:?Set BRICKKEN_RPC_URL, for example https://sepolia.base.org}"
: "${WALLET:?Set WALLET to the address for BRICKKEN_PRIVATE_KEY}"

command -v brickken >/dev/null || { echo "brickken-cli is required (install brickken-cli@0.4.13)" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }

EXPECTED_CLI_VERSION="0.4.11"
if [[ "$(brickken --version)" != "$EXPECTED_CLI_VERSION" ]]; then
  echo "This walkthrough requires brickken-cli@$EXPECTED_CLI_VERSION" >&2
  exit 1
fi

CHAIN="${CHAIN:-84532}"
if [[ "$CHAIN" != "84532" ]]; then
  echo "This walkthrough is Base Sepolia-only (chain 84532)" >&2
  exit 1
fi
ENVIRONMENT="${BRICKKEN_ENV:-sandbox}"
if [[ "$ENVIRONMENT" != "sandbox" ]]; then
  echo "This walkthrough is sandbox-only; set BRICKKEN_ENV=sandbox" >&2
  exit 1
fi
AGENT_NAME="${AGENT_NAME:-Hello World Agent}"
AGENT_DESCRIPTION="${AGENT_DESCRIPTION:-An ERC-8004 agent built with Brickken}"
AGENT_IMAGE_URL="${AGENT_IMAGE_URL:-https://docs.brickken.com/images/build-programme/hello-world-agent.svg}"
AGENT_SERVICE_ENDPOINT="${AGENT_SERVICE_ENDPOINT:-https://docs.brickken.com/downloads/build-programme/agent-card.json}"
AGENT_TOKEN_SYMBOL="${AGENT_TOKEN_SYMBOL:-HWAG}"
OUTPUT_DIR="${OUTPUT_DIR:-$SCRIPT_DIR/out}"
mkdir -p "$OUTPUT_DIR"

echo "Registering the ERC-8004 agent on Base Sepolia..."
brickken --env "$ENVIRONMENT" --rpc-url "$BRICKKEN_RPC_URL" \
  agent register \
  --chain "$CHAIN" \
  --execution-mode client-signed \
  --signer-address "$WALLET" \
  --name "$AGENT_NAME" \
  --description "$AGENT_DESCRIPTION" \
  --image "$AGENT_IMAGE_URL" \
  --service-name A2A \
  --service-endpoint "$AGENT_SERVICE_ENDPOINT" \
  --service-version 0.1.0 \
  --ai-model-provider Brickken \
  --ai-model-name Hello-World \
  --x402-support true \
  --active true \
  --execute --json | tee "$OUTPUT_DIR/register-output.json"

AGENT_UUID="$(jq -er '.prepared.info.agentUuid' "$OUTPUT_DIR/register-output.json")"
AGENT_TX_HASH="$(jq -er '.sent.txHash // .sent.results[0].txHash // .sent.results[0].result.txResponses[0].hash' "$OUTPUT_DIR/register-output.json")"
[[ "$AGENT_UUID" =~ ^[0-9a-fA-F-]{36}$ ]] || { echo "Registration output did not contain a UUID-shaped agentUuid" >&2; exit 1; }
[[ "$AGENT_TX_HASH" =~ ^0x[0-9a-fA-F]{64}$ ]] || { echo "Registration output did not contain a transaction hash" >&2; exit 1; }
jq -e '.sent._x402.settlement.success == true' "$OUTPUT_DIR/register-output.json" >/dev/null

wait_for_receipt() {
  local tx_hash="$1"
  local attempts=0
  while (( attempts < 90 )); do
    local body
    body="$(curl -sS --fail-with-body -X POST "$BRICKKEN_RPC_URL" \
      -H 'content-type: application/json' \
      --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getTransactionReceipt\",\"params\":[\"$tx_hash\"]}")"
    if [[ "$(jq -r '.result // empty' <<<"$body")" != "" ]]; then
      if [[ "$(jq -r '.result.status // "0x0"' <<<"$body")" != "0x1" ]]; then
        echo "Transaction $tx_hash reverted" >&2
        return 1
      fi
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 2
  done
  echo "Timed out waiting for receipt $tx_hash" >&2
  return 1
}

echo "Waiting for the agent registration receipt..."
wait_for_receipt "$AGENT_TX_HASH"

echo "Reading the stored agent profile..."
brickken --env "$ENVIRONMENT" --rpc-url "$BRICKKEN_RPC_URL" \
  agent info --agent-uuid "$AGENT_UUID" --json | tee "$OUTPUT_DIR/agent-info-output.json"
jq -e '.agentUuid // .uuid // .data.agentUuid' "$OUTPUT_DIR/agent-info-output.json" >/dev/null

echo "Deploying the agent-owned ERC-20..."
brickken --env "$ENVIRONMENT" --rpc-url "$BRICKKEN_RPC_URL" \
  create-token \
  --chain "$CHAIN" \
  --execution-mode client-signed \
  --signer-address "$WALLET" \
  --name "Hello World Agent Token" \
  --symbol "$AGENT_TOKEN_SYMBOL" \
  --agent-wallet "$WALLET" \
  --premint 1000 \
  --decimals 18 \
  --execute --json | tee "$OUTPUT_DIR/create-token-output.json"

jq -e '.sent.success == true and ((.tokenAddress // "") | test("^0x[0-9a-fA-F]{40}$"))' \
  "$OUTPUT_DIR/create-token-output.json" >/dev/null
jq -e '.sent._x402.settlement.success == true' "$OUTPUT_DIR/create-token-output.json" >/dev/null
jq -e '.tokenReceipt.status == "0x1"' "$OUTPUT_DIR/create-token-output.json" >/dev/null

TOKEN_ADDRESS="$(jq -er '.tokenAddress' "$OUTPUT_DIR/create-token-output.json")"
TOKEN_TX_HASH="$(jq -er '.tokenTxHash' "$OUTPUT_DIR/create-token-output.json")"
echo "Hello World complete"
echo "Agent UUID: $AGENT_UUID"
echo "Agent registration tx: $AGENT_TX_HASH"
echo "Agent token: $TOKEN_ADDRESS"
echo "Agent token deployment tx: $TOKEN_TX_HASH"
