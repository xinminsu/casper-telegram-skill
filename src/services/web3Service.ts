import { ethers } from 'ethers';
import { RpcClient, PublicKey } from 'casper-js-sdk';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// RPC URL configuration
const rpcUrls = {
  casper: process.env.CASPER_RPC_URL || 'https://node.testnet.casper.network/rpc',
};

// Casper network configuration
const casperChainId = parseInt(process.env.CASPER_CHAIN_ID || '1');
const casperNetwork = {
  chainId: casperChainId,
  name: 'casper',
};

console.log('[Web3Service] Initializing Casper provider with URL:', rpcUrls.casper);
console.log('[Web3Service] Chain ID:', casperChainId);

// Create Provider instances with explicit network configuration
export const providers = {
  casper: new ethers.JsonRpcProvider(rpcUrls.casper, casperNetwork, {
    staticNetwork: true,
    batchMaxCount: 1,
  }),
};

// Create Casper RPC Client for native address support
export const casperRpcClient = new (RpcClient as any)({ nodeAddress: rpcUrls.casper });

// Default to Casper
export const defaultProvider = providers.casper;

/**
 * Helper function to add timeout to promises
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`RPC request timeout after ${timeoutMs / 1000} seconds`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Get Provider for specified network
 */
export function getProvider(network: string = 'casper'): ethers.JsonRpcProvider {
  const provider = providers[network as keyof typeof providers];
  if (!provider) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return provider;
}

/**
 * Query address CSPR balance
 */
export async function getEthBalance(address: string, network: string = 'casper'): Promise<string> {
  try {
    logger.info(`Querying balance for ${address} on ${network}`);
    logger.info(`Provider URL: ${rpcUrls.casper}`);
    
    // Set a timeout for the request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('RPC_REQUEST_TIMEOUT')), 20000);
    });
    
    let balance: bigint;
    
    if (address.startsWith('0x')) {
      // Ethereum-style address - use ethers.js
      logger.info('Using ethers.js for Ethereum-style address');
      const provider = getProvider(network);
      const balancePromise = provider.getBalance(address);
      balance = await Promise.race([balancePromise, timeoutPromise]) as bigint;
    } else {
      // Casper native address - use Casper SDK
      logger.info('Using Casper SDK for native address');
      
      // Detect format
      const isPublicKeyFormat = /^[0-9a-fA-F]{68}$/.test(address);
      const isAccountHashFormat = /^[0-9a-fA-F]{64}$/.test(address);
      
      if (!isPublicKeyFormat && !isAccountHashFormat) {
        throw new Error(
          'Invalid address format.\n\n' +
          'Supported formats:\n' +
          '1. Ethereum-style: 0x + 40 hex chars\n' +
          '2. Casper Public Key: 68 hex chars (starts with 02 or 03)\n' +
          '3. Casper Account Hash: 64 hex chars'
        );
      }
      
      try {
        let accountInfo;
        
        // Use direct RPC calls for both public key and account hash to avoid SDK issues
        if (isPublicKeyFormat) {
          // Query by public key using direct RPC call
          logger.info(`Querying by public key: ${address}`);
          const response = await axios.post(rpcUrls.casper, {
            jsonrpc: '2.0',
            method: 'state_get_account_info',
            params: {
              public_key: address.toLowerCase()
            },
            id: 1
          });
          
          if (!response.data.result || !response.data.result.account) {
            throw new Error('Account not found');
          }
          
          accountInfo = response.data.result;
        } else {
          // Query by account hash using direct RPC call
          logger.info(`Querying by account hash: ${address}`);
          
          // Remove 'account-hash-' prefix if present
          const cleanHash = address.toLowerCase().replace(/^account-hash-/, '');
          
          const response = await axios.post(rpcUrls.casper, {
            jsonrpc: '2.0',
            method: 'state_get_account_info',
            params: {
              account_identifier: {
                AccountHash: cleanHash
              }
            },
            id: 1
          });
          
          if (!response.data.result || !response.data.result.account) {
            throw new Error('Account not found');
          }
          
          accountInfo = response.data.result;
        }
        
        if (!accountInfo || !accountInfo.account) {
          throw new Error(
            `Account not found on Casper network.\n\n` +
            `Possible reasons:\n` +
            `1. The address is incorrect\n` +
            `2. The account has never been activated\n` +
            `3. You're querying testnet but the account is on mainnet (or vice versa)\n\n` +
            `Current RPC: ${rpcUrls.casper}\n` +
            `Check your address at: https://testnet.cspr.live/`
          );
        }
        
        // Get main purse URef
        const mainPurseUref = accountInfo.account.main_purse;
        logger.info(`Main purse uref: ${mainPurseUref}`);
        
        // Get state root hash first (required for balance query)
        logger.info('Getting state root hash...');
        const stateRootResponse = await axios.post(rpcUrls.casper, {
          jsonrpc: '2.0',
          method: 'chain_get_state_root_hash',
          params: {},
          id: 2
        });
        
        if (!stateRootResponse.data.result || !stateRootResponse.data.result.state_root_hash) {
          throw new Error('Failed to get state root hash');
        }
        
        const stateRootHash = stateRootResponse.data.result.state_root_hash;
        logger.info(`State root hash: ${stateRootHash}`);
        
        // Get balance using direct RPC call with state root hash
        logger.info('Querying balance...');
        const balanceResponse = await axios.post(rpcUrls.casper, {
          jsonrpc: '2.0',
          method: 'state_get_balance',
          params: {
            state_root_hash: stateRootHash,
            purse_uref: mainPurseUref
          },
          id: 3
        });
        
        if (!balanceResponse.data.result) {
          throw new Error('Failed to get balance');
        }
        
        const motes = balanceResponse.data.result.balance_value.toString();
        logger.info(`Balance in motes: ${motes}`);
        
        // Convert motes to CSPR (1 CSPR = 10^9 motes)
        const moteValue = BigInt(motes);
        balance = moteValue;
        
      } catch (sdkError: any) {
        const errorMsg = sdkError.message || '';
        logger.error(`Casper SDK error: ${errorMsg}`);
        
        if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT')) {
          throw new Error('Request timeout: Casper RPC node is not responding within 20 seconds');
        }
        
        if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('Account not found')) {
          throw new Error(
            `Account not found on Casper network.\n\n` +
            `Possible reasons:\n` +
            `1. The address is incorrect\n` +
            `2. The account has never been activated\n` +
            `3. You're querying testnet but the account is on mainnet (or vice versa)\n\n` +
            `Current RPC: ${rpcUrls.casper}\n` +
            `Check your address at: https://testnet.cspr.live/`
          );
        }
        
        throw new Error(`Casper SDK error: ${errorMsg}`);
      }
    }
    
    // Convert from motes (1 CSPR = 10^9 motes)
    const formattedBalance = ethers.formatUnits(balance, 9);
    logger.info(`Balance query successful: ${formattedBalance} CSPR`);
    return formattedBalance;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Balance query error: ${errorMessage} | Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    
    if (errorMessage === 'RPC_REQUEST_TIMEOUT') {
      throw new Error('Request timeout: Casper RPC node is not responding within 20 seconds');
    }
    
    // Check for common RPC errors
    if (errorMessage.includes('ECONNREFUSED')) {
      throw new Error('Connection refused: Cannot connect to Casper RPC node');
    }
    if (errorMessage.includes('ENOTFOUND')) {
      throw new Error('DNS error: Casper RPC URL not found');
    }
    if (errorMessage.includes('403') || errorMessage.includes('401')) {
      throw new Error('Access denied: RPC endpoint requires authentication or API key');
    }
    if (errorMessage.includes('429')) {
      throw new Error('Rate limited: Too many requests to RPC endpoint');
    }
    
    throw new Error(`RPC error: ${errorMessage}`);
  }
}

/**
 * Query ERC20 token balance
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  network: string = 'casper'
): Promise<string> {
  const provider = getProvider(network);
  
  // ERC20 ABI - only need balanceOf and decimals functions
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  ];

  const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  
  try {
    const [balance, decimals, symbol] = await withTimeout(Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals(),
      contract.symbol(),
    ]));

    const formattedBalance = ethers.formatUnits(balance, decimals);
    return `${formattedBalance} ${symbol}`;
  } catch (error) {
    throw new Error(`Token balance query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Estimate Gas fees for Casper
 * Note: Casper uses a fixed gas price of 1 mote per gas unit
 */
export async function estimateGas(
  from: string,
  to: string,
  value: string = '0',
  data: string = '0x',
  network: string = 'casper'
): Promise<{
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedCost: string;
}> {
  try {
    // Casper has fixed gas pricing
    const gasPriceMotes = 1; // 1 mote per gas unit (fixed)
    
    // Estimate typical gas limit for CSPR transfers
    // Standard transfer: ~300-500 gas units
    // Complex operations: ~1000-2000 gas units
    const estimatedGasLimit = 500; // Conservative estimate for simple transfers
    
    // Calculate cost in motes
    const costInMotes = BigInt(estimatedGasLimit) * BigInt(gasPriceMotes);
    
    // Convert to CSPR (1 CSPR = 10^9 motes)
    const costInCspr = ethers.formatUnits(costInMotes, 9);
    
    return {
      gasLimit: estimatedGasLimit.toString(),
      gasPrice: `${gasPriceMotes} Mote (fixed)`,
      maxFeePerGas: `${gasPriceMotes} Mote (fixed)`,
      maxPriorityFeePerGas: '0 Mote (N/A)',
      estimatedCost: `${costInCspr} CSPR`,
    };
  } catch (error) {
    throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current Gas price
 * Note: Casper uses a fixed gas price of 1 mote per gas unit
 */
export async function getCurrentGasPrice(network: string = 'casper'): Promise<{
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}> {
  // Casper has a fixed gas price: 1 mote per gas unit
  // 1 CSPR = 10^9 motes
  return {
    gasPrice: '1 Mote (fixed)',
    maxFeePerGas: '1 Mote (fixed)',
    maxPriorityFeePerGas: '0 Mote (N/A)',
  };
}

/**
 * Send transaction (requires private key)
 */
export async function sendTransaction(
  privateKey: string,
  to: string,
  value: string,
  network: string = 'casper'
): Promise<string> {
  const provider = getProvider(network);
  const wallet = new ethers.Wallet(privateKey, provider);

  try {
    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseUnits(value, 9), // Parse as CSPR (9 decimals)
    });

    logger.info(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    logger.info(`Transaction confirmed: ${tx.hash}`);
    
    return tx.hash;
  } catch (error) {
    throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Note: In production, do not import logger directly, should use dependency injection
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};
