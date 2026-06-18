import { PublicKey, AccountHash } from 'casper-js-sdk';

/**
 * Casper Address Utilities
 * 
 * Provides functions to convert between Ethereum-style addresses (0x...) 
 * and native Casper addresses (account-hash-..., public-key-hex-...)
 */

export class CasperAddressUtils {
  /**
   * Check if an address is a valid Casper account hash
   * Format: account-hash-<hex>
   */
  static isAccountHash(address: string): boolean {
    return address.startsWith('account-hash-');
  }

  /**
   * Check if an address is a valid Casper public key hex
   * Format: <hex> (66 chars for secp256k1/ed25519 with prefix)
   */
  static isPublicKeyHex(address: string): boolean {
    // Public keys start with 01 (ed25519), 02 or 03 (secp256k1) + 64 hex chars = 66 chars total
    if (!/^0[1-3][a-fA-F0-9]{64}$/.test(address)) {
      return false;
    }
    return true;
  }

  /**
   * Check if an address is Ethereum-style (0x...)
   */
  static isEthereumStyle(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Convert Ethereum-style address to Casper account hash
   * @param ethAddress - Ethereum address (0x...)
   * @returns Casper account hash (account-hash-...)
   */
  static ethToAccountHash(ethAddress: string): string {
    if (!this.isEthereumStyle(ethAddress)) {
      throw new Error(`Invalid Ethereum address format: ${ethAddress}`);
    }

    try {
      // Remove 0x prefix and convert to bytes
      const hexWithoutPrefix = ethAddress.slice(2);
      const bytes = Buffer.from(hexWithoutPrefix, 'hex');
      
      // Create a Hash object from the bytes
      const { Hash } = require('casper-js-sdk');
      const hash = new Hash(bytes);
      
      // Create AccountHash from the Hash
      const accountHash = new AccountHash(hash);
      
      return accountHash.toPrefixedString();
    } catch (error) {
      throw new Error(`Failed to convert Ethereum address to Casper account hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Casper account hash to Ethereum-style address
   * @param accountHash - Casper account hash (account-hash-...)
   * @returns Ethereum-style address (0x...)
   */
  static accountHashToEth(accountHash: string): string {
    if (!this.isAccountHash(accountHash)) {
      throw new Error(`Invalid Casper account hash format: ${accountHash}`);
    }

    try {
      // Parse the account hash
      const parsed = AccountHash.fromString(accountHash);
      
      // Get the raw bytes using toBytes() method and convert to hex
      const bytes = parsed.toBytes();
      const hex = Buffer.from(bytes).toString('hex');
      
      // Take first 20 bytes (40 hex chars) for Ethereum compatibility
      const ethHex = hex.slice(0, 40);
      
      return `0x${ethHex}`;
    } catch (error) {
      throw new Error(`Failed to convert Casper account hash to Ethereum address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and normalize any Casper address format
   * @param address - Any valid Casper address format
   * @returns Normalized account hash format
   */
  static normalizeAddress(address: string): string {
    // Already in account hash format
    if (this.isAccountHash(address)) {
      return address;
    }

    // Public key hex format
    if (this.isPublicKeyHex(address)) {
      try {
        const publicKey = PublicKey.fromHex(address);
        return publicKey.accountHash().toPrefixedString();
      } catch (error) {
        throw new Error(`Invalid public key hex: ${address}`);
      }
    }

    // Ethereum-style format
    if (this.isEthereumStyle(address)) {
      return this.ethToAccountHash(address);
    }

    throw new Error(`Unsupported address format: ${address}\nSupported formats:\n- account-hash-... (Casper account hash)\n- 02/03... (Public key hex, 66 chars)\n- 0x... (Ethereum-style, 42 chars)`);
  }

  /**
   * Get address type
   */
  static getAddressType(address: string): 'account-hash' | 'public-key' | 'ethereum' | 'unknown' {
    if (this.isAccountHash(address)) return 'account-hash';
    if (this.isPublicKeyHex(address)) return 'public-key';
    if (this.isEthereumStyle(address)) return 'ethereum';
    return 'unknown';
  }

  /**
   * Convert any address to all supported formats
   */
  static convertAllFormats(address: string): {
    original: string;
    type: string;
    accountHash: string;
    ethereum?: string;
    publicKeyHex?: string;
  } {
    const normalized = this.normalizeAddress(address);
    const type = this.getAddressType(address);

    const result: any = {
      original: address,
      type,
      accountHash: normalized,
    };

    // Try to get Ethereum format
    try {
      result.ethereum = this.accountHashToEth(normalized);
    } catch (e) {
      // Ignore if conversion fails
    }

    return result;
  }
}
