import { parseArgs } from 'node:util';
import process from 'node:process';
import fs from 'node:fs';
import { isAddress } from 'viem';
import { generateStorageProof } from '../core/proof-generator.js';
import { BlockHashMismatchError, StateRootMismatchError } from '../core/types.js';

const HELP_TEXT = `
storage-proof-generator - Generate Ethereum storage proofs for cross-chain verification

Usage:
  storage-proof-generator --rpc <url> --account <address> --slot <number> --block <number> [--output <file>]

Options:
  --rpc      RPC endpoint URL (required)
  --account  Account address to prove storage for (required)
  --slot     Storage slot number or hex (required)
  --block    Block number to generate proof at (required)
  --output   Output file path (optional, prints to stdout if not specified)
  --help     Show this help message

Examples:
  # Generate proof and print to stdout
  storage-proof-generator \\
    --rpc "https://rpc.example.com" \\
    --account "0x1234567890123456789012345678901234567890" \\
    --slot "0" \\
    --block "12345678"

  # Generate proof and save to file
  storage-proof-generator \\
    --rpc "https://rpc.example.com" \\
    --account "0x1234567890123456789012345678901234567890" \\
    --slot "0x5cf0a02c352c6c9b0b5b9dac0097e6646e044e84c5444c271bb7e25f050dd8bc" \\
    --block "12345678" \\
    --output "proof.json"
`;

function fail(msg: string): never {
  console.error(`[storage-proof-generator] Error: ${msg}`);
  process.exit(1);
}

function log(msg: string): void {
  console.log(`[storage-proof-generator] ${msg}`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      rpc: { type: 'string' },
      account: { type: 'string' },
      slot: { type: 'string' },
      block: { type: 'string' },
      output: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Validate required arguments
  if (!values.rpc) fail('--rpc is required');
  if (!values.account) fail('--account is required');
  if (!values.slot) fail('--slot is required');
  if (!values.block) fail('--block is required');

  // Validate account address
  if (!isAddress(values.account)) {
    fail('--account must be a valid EVM address');
  }

  // Parse slot (supports both decimal and hex)
  let slot: bigint;
  try {
    slot = BigInt(values.slot);
  } catch {
    fail(`Invalid slot value: ${values.slot}`);
  }

  // Parse block number
  let blockNumber: bigint;
  try {
    blockNumber = BigInt(values.block);
  } catch {
    fail(`Invalid block number: ${values.block}`);
  }

  log(`Generating proof for block ${blockNumber}...`);
  log(`  Account: ${values.account}`);
  log(`  Slot: ${values.slot}`);

  try {
    const proof = await generateStorageProof({
      rpc: values.rpc,
      account: values.account as `0x${string}`,
      slot,
      blockNumber,
    });

    log(`Proof generated successfully`);
    log(`  Block hash: ${proof.blockHash}`);
    log(`  State root: ${proof.stateRoot}`);
    log(`  Slot value: ${proof.slotValue}`);

    const output = JSON.stringify(proof, null, 2);

    if (values.output) {
      fs.writeFileSync(values.output, output);
      log(`Proof saved to ${values.output}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    if (error instanceof BlockHashMismatchError) {
      fail(`Block hash verification failed.\n  Expected: ${error.expected}\n  Computed: ${error.computed}`);
    }
    if (error instanceof StateRootMismatchError) {
      fail(`State root verification failed.\n  Expected: ${error.expected}\n  Computed: ${error.computed}`);
    }
    if (error instanceof Error) {
      fail(error.message);
    }
    fail(String(error));
  }
}

main();
