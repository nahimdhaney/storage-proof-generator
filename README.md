# @openintents/storage-proof-generator

Generate Ethereum storage proofs for cross-chain verification. Works in Node.js and browser environments.

## Installation

```bash
npm install @openintents/storage-proof-generator
# or
yarn add @openintents/storage-proof-generator
# or
pnpm add @openintents/storage-proof-generator
```

## Usage

### As a Library (Browser & Node.js)

```typescript
import { generateStorageProof } from '@openintents/storage-proof-generator';

const proof = await generateStorageProof({
  rpc: 'https://rpc.example.com',
  account: '0x1234567890123456789012345678901234567890',
  slot: 0n, // Storage slot as bigint
  blockNumber: 12345678n,
});

console.log(proof);
// {
//   blockNumber: '0xbc614e',
//   blockHash: '0x...',
//   stateRoot: '0x...',
//   account: '0x1234...',
//   slot: '0x0000...0000',
//   slotValue: '0x...',
//   rlpBlockHeader: '0x...',
//   rlpAccountProof: '0x...',
//   rlpStorageProof: '0x...',
// }
```

### Reusable Generator Instance

For generating multiple proofs against the same RPC:

```typescript
import { createProofGenerator } from '@openintents/storage-proof-generator';

const generator = createProofGenerator('https://rpc.example.com');

const proof1 = await generator.generate({
  account: '0x1234...',
  slot: 0n,
  blockNumber: 12345678n,
});

const proof2 = await generator.generate({
  account: '0x5678...',
  slot: 1n,
  blockNumber: 12345678n,
});
```

### Node.js File Utilities

```typescript
import { generateAndSaveProof, loadProof } from '@openintents/storage-proof-generator/node';

// Generate and save to file
await generateAndSaveProof(
  {
    rpc: 'https://rpc.example.com',
    account: '0x1234...',
    slot: 0n,
    blockNumber: 12345678n,
  },
  './proof.json'
);

// Load from file
const proof = loadProof('./proof.json');
```

### CLI

```bash
# Install globally
npm install -g @openintents/storage-proof-generator

# Generate proof
storage-proof-generator \
  --rpc "https://rpc.example.com" \
  --account "0x1234567890123456789012345678901234567890" \
  --slot "0" \
  --block "12345678" \
  --output "proof.json"
```

## API Reference

### `generateStorageProof(options)`

Generates a complete storage proof for cross-chain verification.

**Parameters:**
- `options.rpc` - RPC endpoint URL
- `options.account` - Account address to prove storage for
- `options.slot` - Storage slot (as bigint)
- `options.blockNumber` - Block number to generate proof at (as bigint)

**Returns:** `Promise<StorageProof>`

### `createProofGenerator(rpc)`

Creates a reusable proof generator instance.

**Parameters:**
- `rpc` - RPC endpoint URL

**Returns:** Object with `generate()` method and `getClient()` method

### Types

```typescript
interface StorageProof {
  blockNumber: Hex;
  blockHash: Hex;
  stateRoot: Hex;
  account: string;
  slot: Hex;
  slotValue: Hex;
  rlpBlockHeader: Hex;
  rlpAccountProof: Hex;
  rlpStorageProof: Hex;
  sendRoot?: Hex; // For Arbitrum-style chains
}

interface ProofGeneratorOptions {
  rpc: string;
  account: `0x${string}`;
  slot: bigint;
  blockNumber: bigint;
}
```

## How It Works

1. **Fetch Block Header** - Gets the block header at the specified block number
2. **RLP Encode** - Encodes the block header using RLP (tries `debug_getRawHeader` first, falls back to manual encoding)
3. **Verify Block Hash** - Ensures `keccak256(rlpBlockHeader) === blockHash`
4. **Generate Merkle Proofs** - Uses `eth_getProof` to get account and storage proofs
5. **Verify State Root** - Ensures computed state root matches block header

## Cross-Chain Verification

The generated proof can be used on-chain to verify storage values from another chain:

```solidity
// On-chain verification (simplified)
function verifyStorageProof(
    bytes32 trustedBlockHash,
    bytes calldata rlpBlockHeader,
    bytes calldata rlpAccountProof,
    bytes calldata rlpStorageProof
) external view returns (bytes32 value) {
    // 1. Verify block header hashes to trusted hash
    require(keccak256(rlpBlockHeader) == trustedBlockHash);

    // 2. Extract state root from block header
    bytes32 stateRoot = extractStateRoot(rlpBlockHeader);

    // 3. Verify account proof against state root
    bytes32 storageRoot = verifyAccountProof(rlpAccountProof, stateRoot);

    // 4. Verify storage proof against storage root
    value = verifyStorageProof(rlpStorageProof, storageRoot);
}
```

## Supported Networks

Works with any EVM-compatible chain that supports:
- `eth_getBlockByNumber`
- `eth_getProof`

Optionally uses `debug_getRawHeader` for more accurate block header encoding.

## License

MIT
