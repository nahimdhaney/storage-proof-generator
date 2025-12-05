/**
 * Node.js specific utilities for storage proof generation.
 * Includes file I/O helpers.
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateStorageProof, type ProofGeneratorOptions, type StorageProof } from '../core/index.js';

/**
 * Generate a storage proof and save it to a file.
 *
 * @param options - Proof generation options
 * @param outputPath - Path to save the proof JSON
 * @returns The generated proof
 *
 * @example
 * ```typescript
 * import { generateAndSaveProof } from 'openintents-storage-proof-generator/node';
 *
 * const proof = await generateAndSaveProof(
 *   {
 *     rpc: 'https://rpc.example.com',
 *     account: '0x1234...',
 *     slot: 0n,
 *     blockNumber: 12345678n,
 *   },
 *   './proof.json'
 * );
 * ```
 */
export async function generateAndSaveProof(
  options: ProofGeneratorOptions,
  outputPath: string
): Promise<StorageProof> {
  const proof = await generateStorageProof(options);

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(proof, null, 2));
  return proof;
}

/**
 * Load a previously generated proof from a file.
 *
 * @param filePath - Path to the proof JSON file
 * @returns The loaded proof
 *
 * @example
 * ```typescript
 * import { loadProof } from 'openintents-storage-proof-generator/node';
 *
 * const proof = loadProof('./proof.json');
 * console.log(proof.blockHash);
 * ```
 */
export function loadProof(filePath: string): StorageProof {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as StorageProof;
}

/**
 * Check if a proof file exists.
 *
 * @param filePath - Path to check
 * @returns True if file exists
 */
export function proofExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// Re-export core functionality
export * from '../core/index.js';
