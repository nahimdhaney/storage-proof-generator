import type { Hex } from 'viem';

/**
 * Options for generating a storage proof
 */
export interface ProofGeneratorOptions {
  /** RPC endpoint URL */
  rpc: string;
  /** Account address to prove storage for */
  account: `0x${string}`;
  /** Storage slot to prove */
  slot: bigint;
  /** Block number to generate proof at */
  blockNumber: bigint;
}

/**
 * Generated storage proof result
 */
export interface StorageProof {
  /** Block number in hex */
  blockNumber: Hex;
  /** Block hash */
  blockHash: Hex;
  /** State root from block header */
  stateRoot: Hex;
  /** Account address */
  account: string;
  /** Storage slot in hex (32 bytes) */
  slot: Hex;
  /** Value at the storage slot */
  slotValue: Hex;
  /** RLP-encoded block header */
  rlpBlockHeader: Hex;
  /** RLP-encoded account proof (Merkle-Patricia trie proof) */
  rlpAccountProof: Hex;
  /** RLP-encoded storage proof (Merkle-Patricia trie proof) */
  rlpStorageProof: Hex;
  /** Optional: sendRoot for Arbitrum-style chains */
  sendRoot?: Hex;
}

/**
 * Chain configuration for cross-chain proofs
 */
export interface ChainConfig {
  /** Chain ID */
  chainId: number;
  /** Human-readable chain name */
  name: string;
  /** RPC endpoint URL */
  rpc: string;
  /** SignalService contract address */
  signalService: `0x${string}`;
  /** Broadcaster contract address */
  broadcaster: `0x${string}`;
  /** Storage slot for checkpoints mapping in SignalService */
  checkpointsSlot: number;
  /** Block explorer URL */
  explorer?: string;
}

/**
 * Taiko-specific configuration with L1 and L2 chains
 */
export interface TaikoConfig {
  l1: ChainConfig;
  l2: ChainConfig;
}

/**
 * Direction of cross-chain proof
 */
export type ProofDirection = 'l1-to-l2' | 'l2-to-l1';

/**
 * Checkpoint data from SignalService
 */
export interface Checkpoint {
  /** Block number that was checkpointed */
  blockNumber: number;
  /** Block hash */
  blockHash: Hex;
  /** State root */
  stateRoot: Hex;
}

/**
 * Error thrown when block hash verification fails
 */
export class BlockHashMismatchError extends Error {
  constructor(
    public expected: Hex,
    public computed: Hex
  ) {
    super(`Block hash mismatch: expected ${expected}, computed ${computed}`);
    this.name = 'BlockHashMismatchError';
  }
}

/**
 * Error thrown when state root verification fails
 */
export class StateRootMismatchError extends Error {
  constructor(
    public expected: Hex,
    public computed: Hex
  ) {
    super(`State root mismatch: expected ${expected}, computed ${computed}`);
    this.name = 'StateRootMismatchError';
  }
}

/**
 * Error thrown when RPC method is not available
 */
export class RpcMethodNotAvailableError extends Error {
  constructor(public method: string) {
    super(`RPC method not available: ${method}`);
    this.name = 'RpcMethodNotAvailableError';
  }
}
