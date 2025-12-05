import { createPublicClient, http, toRlp, keccak256, toHex, type Hex, type PublicClient } from 'viem';
import { encodeBlockHeaderToRlp, type RpcBlockHeader } from './rlp-encoder.js';
import {
  type ProofGeneratorOptions,
  type StorageProof,
  BlockHashMismatchError,
  StateRootMismatchError,
} from './types.js';

/**
 * Internal function to get RLP-encoded block header.
 * First tries debug_getRawHeader RPC method, falls back to manual encoding.
 *
 * @param client - Viem public client
 * @param blockNumber - Block number to get header for
 * @param blockHeader - Block header from getBlock (used for manual encoding fallback)
 * @returns Object containing RLP header and method used
 */
async function getRlpBlockHeader(
  client: PublicClient,
  blockNumber: bigint,
  blockHeader: RpcBlockHeader & { hash: Hex }
): Promise<{ rlpHeader: Hex; method: 'debug_getRawHeader' | 'manual' }> {
  try {
    // Try to use debug_getRawHeader if available (faster, more accurate)
    const rawHeader = (await client.request({
      method: 'debug_getRawHeader' as any,
      params: [toHex(blockNumber)] as any,
    })) as Hex;

    return { rlpHeader: rawHeader, method: 'debug_getRawHeader' };
  } catch {
    // Fall back to manual RLP encoding
    const rlpHeader = encodeBlockHeaderToRlp(blockHeader as unknown as RpcBlockHeader);
    return { rlpHeader, method: 'manual' };
  }
}

/**
 * Internal function to get account and storage proofs.
 *
 * @param client - Viem public client
 * @param account - Account address
 * @param slot - Storage slot
 * @param blockNumber - Block number
 * @returns Proofs and computed state root
 */
async function getStorageAndAccountProof(
  client: PublicClient,
  account: `0x${string}`,
  slot: bigint,
  blockNumber: bigint
): Promise<{
  rlpAccountProof: Hex;
  rlpStorageProof: Hex;
  slotValue: Hex;
  computedStateRoot: Hex;
}> {
  const proof = await client.getProof({
    address: account,
    storageKeys: [toHex(slot, { size: 32 })],
    blockNumber,
  });

  return {
    computedStateRoot: keccak256(proof.accountProof[0]),
    rlpAccountProof: toRlp(proof.accountProof),
    rlpStorageProof: toRlp(proof.storageProof[0].proof),
    slotValue: toHex(proof.storageProof[0].value),
  };
}

/**
 * Generates a complete storage proof for cross-chain verification.
 *
 * This function:
 * 1. Fetches the block header at the specified block number
 * 2. RLP-encodes the block header (using debug_getRawHeader or manual encoding)
 * 3. Verifies the block hash matches
 * 4. Generates Merkle-Patricia trie proofs for the account and storage slot
 * 5. Verifies the state root matches
 *
 * @param options - Proof generation options
 * @returns Complete storage proof ready for on-chain verification
 * @throws {BlockHashMismatchError} If computed block hash doesn't match
 * @throws {StateRootMismatchError} If computed state root doesn't match
 *
 * @example
 * ```typescript
 * import { generateStorageProof } from '@openintents/storage-proof-generator';
 *
 * const proof = await generateStorageProof({
 *   rpc: 'https://rpc.example.com',
 *   account: '0x1234567890123456789012345678901234567890',
 *   slot: 0n,
 *   blockNumber: 12345678n,
 * });
 *
 * console.log(proof.rlpBlockHeader);
 * console.log(proof.rlpAccountProof);
 * console.log(proof.rlpStorageProof);
 * ```
 */
export async function generateStorageProof(options: ProofGeneratorOptions): Promise<StorageProof> {
  const { rpc, account, slot, blockNumber } = options;

  const client = createPublicClient({
    transport: http(rpc),
  });

  // Get block header
  const blockHeader = await client.getBlock({
    blockNumber,
  });

  // Get RLP-encoded block header
  const { rlpHeader: rlpBlockHeader } = await getRlpBlockHeader(
    client,
    blockNumber,
    blockHeader as unknown as RpcBlockHeader & { hash: Hex }
  );

  // Verify block hash
  const computedBlockHash = keccak256(rlpBlockHeader);
  if (computedBlockHash !== blockHeader.hash) {
    throw new BlockHashMismatchError(blockHeader.hash, computedBlockHash);
  }

  // Get account and storage proofs
  const { computedStateRoot, rlpAccountProof, rlpStorageProof, slotValue } =
    await getStorageAndAccountProof(client, account, slot, blockNumber);

  // Verify state root
  if (computedStateRoot !== blockHeader.stateRoot) {
    throw new StateRootMismatchError(blockHeader.stateRoot, computedStateRoot);
  }

  // Build result
  const result: StorageProof = {
    blockNumber: toHex(blockHeader.number),
    blockHash: blockHeader.hash,
    stateRoot: blockHeader.stateRoot,
    account,
    slot: toHex(slot, { size: 32 }),
    slotValue,
    rlpBlockHeader,
    rlpAccountProof,
    rlpStorageProof,
  };

  // Include sendRoot for Arbitrum-style chains if present
  if ('sendRoot' in blockHeader && blockHeader.sendRoot) {
    result.sendRoot = (blockHeader as any).sendRoot;
  }

  return result;
}

/**
 * Creates a reusable proof generator instance with a pre-configured client.
 * Use this when generating multiple proofs against the same RPC endpoint.
 *
 * @param rpc - RPC endpoint URL
 * @returns Object with generate method
 *
 * @example
 * ```typescript
 * const generator = createProofGenerator('https://rpc.example.com');
 *
 * const proof1 = await generator.generate({
 *   account: '0x1234...',
 *   slot: 0n,
 *   blockNumber: 12345678n,
 * });
 *
 * const proof2 = await generator.generate({
 *   account: '0x5678...',
 *   slot: 1n,
 *   blockNumber: 12345678n,
 * });
 * ```
 */
export function createProofGenerator(rpc: string) {
  const client = createPublicClient({
    transport: http(rpc),
  });

  return {
    /**
     * Generate a storage proof using the pre-configured client
     */
    async generate(options: Omit<ProofGeneratorOptions, 'rpc'>): Promise<StorageProof> {
      return generateStorageProof({ ...options, rpc });
    },

    /**
     * Get the underlying viem client for advanced usage
     */
    getClient(): PublicClient {
      return client;
    },
  };
}
