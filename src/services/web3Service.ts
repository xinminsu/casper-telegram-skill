import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { CasperAddressUtils } from '../utils/casperAddress';

// Load environment variables first
dotenv.config();

// RPC URL configuration
const rpcUrls = {
  casper: process.env.CASPER_RPC_URL || 'https://rpc.casper.network',
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
 * Query address ETH balance
 * Supports Ethereum-style (0x...), Casper account hash, and public key formats
 */
export async function getEthBalance(address: string, network: string = 'casper'): Promise<string> {
  try {
    const provider = getProvider(network);
    
    // Normalize address to Casper format if needed
    let normalizedAddress = address;
    const addressType = CasperAddressUtils.getAddressType(address);
    
    logger.info(`Querying balance for ${address} (${addressType}) on ${network}`);
    logger.info(`Provider URL: ${provider._getConnection().url}`);
    
    // For now, ethers.js can work with 0x addresses directly
    // In future, we may need to convert to native Casper format for RPC calls
    if (addressType === 'ethereum') {
      normalizedAddress = address; // Keep as-is for ethers.js
    } else if (addressType === 'account-hash' || addressType === 'public-key') {
      // Convert to Ethereum-style for compatibility with current RPC setup
      try {
        normalizedAddress = CasperAddressUtils.accountHashToEth(
          addressType === 'public-key' ? CasperAddressUtils.normalizeAddress(address) : address
        );
        logger.info(`Converted ${addressType} to Ethereum format: ${normalizedAddress}`);
      } catch (error) {
        logger.warn(`Could not convert Casper address, using original: ${error instanceof Error ? error.message : 'Unknown'}`);
        normalizedAddress = address;
      }
    }
    
    // Set a timeout for the request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('RPC_REQUEST_TIMEOUT')), 20000);
    });
    
    logger.info('Calling provider.getBalance()...');
    const balancePromise = provider.getBalance(normalizedAddress);
    
    // Race between the balance query and timeout
    const balance = await Promise.race([balancePromise, timeoutPromise]) as bigint;
    
    const formattedBalance = ethers.formatEther(balance);
    logger.info(`Balance query successful: ${formattedBalance} ETH`);
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
 * Estimate Gas fees
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
  const provider = getProvider(network);

  try {
    // First check if addresses are valid and have balance
    const fromBalance = await provider.getBalance(from);
    const transferValue = ethers.parseEther(value);
    
    if (fromBalance < transferValue) {
      throw new Error(`Insufficient balance: has ${ethers.formatEther(fromBalance)} ETH, needs ${value} ETH`);
    }

    // Check if destination is a contract
    const code = await provider.getCode(to);
    const isContract = code !== '0x';
    
    // Estimate gas limit with error handling
    let gasLimit;
    try {
      gasLimit = await withTimeout(provider.estimateGas({
        from,
        to,
        value: transferValue,
        data,
      }));
    } catch (estimateError) {
      const errorMsg = estimateError instanceof Error ? estimateError.message : 'Unknown error';
      
      if (errorMsg.includes('CALL_EXCEPTION') || errorMsg.includes('execution reverted')) {
        let reason = '';
        if (isContract) {
          reason = `The destination address is a smart contract that rejected the transaction.`;
        } else {
          reason = `The transaction would fail on-chain. The destination address may be invalid or restricted.`;
        }
        
        throw new Error(`${reason}\n\nSuggestion: Try with a different recipient address (e.g., a regular wallet address)`);
      }
      
      throw estimateError;
    }

    // Get gas price information
    const feeData = await withTimeout(provider.getFeeData());
    
    const gasPrice = feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0';
    const maxFeePerGas = feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : '0';
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : '0';

    // Estimate total cost (ETH)
    const estimatedCost = ethers.formatEther(gasLimit * (feeData.gasPrice || 0n));

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: `${gasPrice} Gwei`,
      maxFeePerGas: `${maxFeePerGas} Gwei`,
      maxPriorityFeePerGas: `${maxPriorityFeePerGas} Gwei`,
      estimatedCost: `${estimatedCost} ETH`,
    };
  } catch (error) {
    throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current Gas price
 */
export async function getCurrentGasPrice(network: string = 'casper'): Promise<{
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}> {
  const provider = getProvider(network);
  const feeData = await withTimeout(provider.getFeeData());

  return {
    gasPrice: feeData.gasPrice ? `${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei` : 'N/A',
    maxFeePerGas: feeData.maxFeePerGas ? `${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} Gwei` : 'N/A',
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? `${ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')} Gwei` : 'N/A',
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
      value: ethers.parseEther(value),
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
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};
