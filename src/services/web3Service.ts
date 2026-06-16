import { ethers } from 'ethers';

// RPC URL configuration
const rpcUrls = {
  pharos: process.env.PHAROS_RPC_URL || 'https://rpc.pharos.network',
};

// Create Provider instances
export const providers = {
  pharos: new ethers.JsonRpcProvider(rpcUrls.pharos),
};

// Default to Pharos
export const defaultProvider = providers.pharos;

/**
 * Get Provider for specified network
 */
export function getProvider(network: string = 'pharos'): ethers.JsonRpcProvider {
  const provider = providers[network as keyof typeof providers];
  if (!provider) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return provider;
}

/**
 * Query address ETH balance
 */
export async function getEthBalance(address: string, network: string = 'pharos'): Promise<string> {
  const provider = getProvider(network);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

/**
 * Query ERC20 token balance
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  network: string = 'pharos'
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
    const [balance, decimals, symbol] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals(),
      contract.symbol(),
    ]);

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
  network: string = 'pharos'
): Promise<{
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedCost: string;
}> {
  const provider = getProvider(network);

  try {
    // Estimate gas limit
    const gasLimit = await provider.estimateGas({
      from,
      to,
      value: ethers.parseEther(value),
      data,
    });

    // Get gas price information
    const feeData = await provider.getFeeData();
    
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
export async function getCurrentGasPrice(network: string = 'pharos'): Promise<{
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}> {
  const provider = getProvider(network);
  const feeData = await provider.getFeeData();

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
  network: string = 'pharos'
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
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};
