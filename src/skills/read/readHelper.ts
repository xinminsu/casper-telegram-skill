import { ethers } from 'ethers';

/**
 * Truncate a string for display
 */
export function truncate(str: string, maxLen: number = 50): string {
  if (!str) return 'N/A';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

/**
 * Format timestamp (Casper uses milliseconds)
 */
export function formatTimestamp(ts?: number): string {
  if (!ts) return 'N/A';
  return new Date(ts).toUTCString();
}

/**
 * Convert motes to CSPR display string
 */
export function motesToCspr(motes: string | number): string {
  try {
    return ethers.formatUnits(BigInt(motes), 9);
  } catch {
    return '0';
  }
}

/**
 * Create a standard read query markdown response
 * Replaces Discord's createReadEmbed - returns Markdown text for Telegram
 */
export function createReadText(
  title: string,
  fields: { name: string; value: string; inline?: boolean }[]
): string {
  let text = `*${title}*\n\n`;

  for (const field of fields) {
    text += `*${field.name}:* ${field.value}\n`;
  }

  text += `\n_Casper Telegram Bot - Read Query_`;
  return text;
}

/**
 * Create an error markdown response
 * Replaces Discord's createErrorEmbed - returns Markdown text for Telegram
 */
export function createErrorText(title: string, errorMessage: string): string {
  return `❌ *${title}*\n\n*Error:* ${truncate(errorMessage, 200)}`;
}

/**
 * Validate Casper public key format (68 hex chars, starts with 02 or 03)
 */
export function validatePublicKey(key: string): boolean {
  return /^[0-9a-fA-F]{68}$/.test(key);
}

/**
 * Validate Casper account hash format (64 hex chars)
 */
export function validateAccountHash(hash: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hash);
}

/**
 * Validate Casper address (public key or account hash)
 */
export function validateAddress(address: string): boolean {
  return validatePublicKey(address) || validateAccountHash(address);
}

/**
 * Validate contract hash (32 bytes = 64 hex chars, or with 'hash-' prefix)
 */
export function validateContractHash(hash: string): boolean {
  const clean = hash.replace(/^hash-/, '').replace(/^0x/, '');
  return /^[0-9a-fA-F]{64}$/.test(clean);
}

/**
 * Normalize contract hash to include 'hash-' prefix
 */
export function normalizeContractHash(hash: string): string {
  const clean = hash.replace(/^hash-/, '').replace(/^0x/, '');
  return `hash-${clean}`;
}

/**
 * Normalize URef format (uref-xxx-yyy)
 */
export function normalizeURef(uref: string): string {
  if (uref.startsWith('uref-')) return uref;
  const clean = uref.replace(/^0x/, '');
  return `uref-${clean}`;
}

/**
 * Parse CLValue to readable string (best effort)
 */
export function parseCLValue(clValue: any): string {
  if (!clValue) return 'N/A';

  // If it has parsed value
  if (clValue.parsed !== undefined) {
    if (typeof clValue.parsed === 'string') return clValue.parsed;
    return JSON.stringify(clValue.parsed);
  }

  // If it has bytes and cl_type
  if (clValue.bytes && clValue.cl_type) {
    return `${clValue.cl_type} (raw: ${truncate(clValue.bytes, 40)})`;
  }

  return JSON.stringify(clValue);
}
