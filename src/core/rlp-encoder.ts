import { toRlp, type Hex } from 'viem';

/**
 * Encodes an integer to RLP-compatible hex format
 * @param hex - Hex string representing the integer
 * @returns Formatted hex string suitable for RLP encoding
 */
function encodeInt(hex: string): Hex {
  const value = BigInt(hex);
  if (value === 0n) return '0x' as Hex;
  return cleanHex(value.toString(16));
}

/**
 * Cleans a hex string to ensure proper formatting
 * @param hex - Hex string to clean
 * @returns Properly formatted hex string with 0x prefix and even length
 */
function cleanHex(hex: string): Hex {
  const clean = hex.replace(/^0x/, '');
  return `0x${clean.length % 2 === 0 ? clean : '0' + clean}` as Hex;
}

/**
 * Block header fields from RPC response
 */
export interface RpcBlockHeader {
  parentHash: string;
  sha3Uncles: string;
  miner: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  logsBloom: string;
  difficulty: string;
  number: string;
  gasLimit: string;
  gasUsed: string;
  timestamp: string;
  extraData: string;
  mixHash: string;
  nonce: string;
  // Post-London (EIP-1559)
  baseFeePerGas?: string;
  // Post-Shanghai (EIP-4895)
  withdrawalsRoot?: string;
  // Post-Cancun (EIP-4844)
  blobGasUsed?: string;
  excessBlobGas?: string;
  parentBeaconBlockRoot?: string;
  // Post-Pectra (EIP-7685)
  requestsHash?: string;
}

/**
 * Converts an RPC block response to RLP-encoded block header.
 * Works with all Ethereum hard forks up to Pectra.
 *
 * For reference on block structure:
 * @see https://github.com/ethereum/go-ethereum/blob/35dd84ce2999ecf5ca8ace50a4d1a6abc231c370/core/types/block.go#L75-L109
 *
 * @param rpcBlock - Block header from RPC response
 * @returns RLP-encoded block header as hex string
 */
export function encodeBlockHeaderToRlp(rpcBlock: RpcBlockHeader): Hex {
  const headerFields: Hex[] = [
    cleanHex(rpcBlock.parentHash),
    cleanHex(rpcBlock.sha3Uncles),
    cleanHex(rpcBlock.miner),
    cleanHex(rpcBlock.stateRoot),
    cleanHex(rpcBlock.transactionsRoot),
    cleanHex(rpcBlock.receiptsRoot),
    cleanHex(rpcBlock.logsBloom),
    encodeInt(rpcBlock.difficulty),
    encodeInt(rpcBlock.number),
    encodeInt(rpcBlock.gasLimit),
    encodeInt(rpcBlock.gasUsed),
    encodeInt(rpcBlock.timestamp),
    cleanHex(rpcBlock.extraData),
    cleanHex(rpcBlock.mixHash),
    cleanHex(rpcBlock.nonce),
  ];

  // EIP-1559: London hard fork
  if (rpcBlock.baseFeePerGas) {
    headerFields.push(encodeInt(rpcBlock.baseFeePerGas));
  }

  // EIP-4895: Shanghai hard fork (withdrawals)
  if (rpcBlock.withdrawalsRoot) {
    headerFields.push(cleanHex(rpcBlock.withdrawalsRoot));
  }

  // EIP-4844: Cancun hard fork (blobs)
  if (rpcBlock.blobGasUsed) {
    headerFields.push(encodeInt(rpcBlock.blobGasUsed));
  }
  if (rpcBlock.excessBlobGas !== undefined) {
    headerFields.push(encodeInt(rpcBlock.excessBlobGas));
  }
  if (rpcBlock.parentBeaconBlockRoot) {
    headerFields.push(cleanHex(rpcBlock.parentBeaconBlockRoot));
  }

  // EIP-7685: Pectra hard fork (requests)
  if (rpcBlock.requestsHash) {
    headerFields.push(cleanHex(rpcBlock.requestsHash));
  }

  return toRlp(headerFields);
}
