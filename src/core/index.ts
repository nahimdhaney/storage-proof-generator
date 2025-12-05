/**
 * openintents-storage-proof-generator
 *
 * Generate Ethereum storage proofs for cross-chain verification.
 *
 * @packageDocumentation
 */

// Main exports
export { generateStorageProof, createProofGenerator } from './proof-generator.js';

// Types
export type {
  ProofGeneratorOptions,
  StorageProof,
  ChainConfig,
  TaikoConfig,
  ProofDirection,
  Checkpoint,
} from './types.js';

// Errors
export { BlockHashMismatchError, StateRootMismatchError, RpcMethodNotAvailableError } from './types.js';

// RLP utilities (for advanced usage)
export { encodeBlockHeaderToRlp, type RpcBlockHeader } from './rlp-encoder.js';
