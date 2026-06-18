import { Context } from 'telegraf';
import { ethers } from 'ethers';
import { estimateGas, getCurrentGasPrice } from '../../services/web3Service';
import { logger } from '../../utils/logger';

export async function handleGasPriceCommand(ctx: Context) {
  try {
    const gasPrices = await getCurrentGasPrice();

    const response = 
      `⛽ Current Gas Price\n\n` +
      `*Network:* CASPER\n` +
      `*Gas Price:* \`${gasPrices.gasPrice}\`\n` +
      `*Max Fee Per Gas:* \`${gasPrices.maxFeePerGas}\`\n` +
      `*Priority Fee:* \`${gasPrices.maxPriorityFeePerGas}\``;

    await ctx.reply(response, { parse_mode: 'Markdown' });

    logger.info(`Query Gas price: Casper`);
  } catch (error) {
    logger.error('Gas price query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleGasEstimateCommand(ctx: Context) {
  // Get command arguments from message text
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1); // Remove command name
  
  if (args.length < 2) {
    await ctx.reply('❌ Usage: /gas-estimate <from_address> <to_address> [value_in_eth]');
    return;
  }

  const from = args[0];
  const to = args[1];
  const value = args[2] || '0';

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(from) || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
    await ctx.reply('❌ Invalid wallet address format. Addresses must be 42 characters (0x + 40 hex chars)');
    return;
  }

  try {
    // Convert addresses to checksum format to avoid checksum errors
    const checksumFrom = ethers.getAddress(from.toLowerCase());
    const checksumTo = ethers.getAddress(to.toLowerCase());
    
    const gasInfo = await estimateGas(checksumFrom, checksumTo, value, '0x');

    const response = 
      `⛽ Gas Estimation Result\n\n` +
      `*From:* \`${from}\`\n` +
      `*To:* \`${to}\`\n` +
      `*Amount:* ${value} ETH\n` +
      `*Network:* Casper\n\n` +
      `*Gas Limit:* \`${gasInfo.gasLimit}\`\n` +
      `*Gas Price:* \`${gasInfo.gasPrice}\`\n` +
      `*Max Fee Per Gas:* \`${gasInfo.maxFeePerGas}\`\n` +
      `*Priority Fee:* \`${gasInfo.maxPriorityFeePerGas}\`\n\n` +
      `*Estimated Total Cost:* \`${gasInfo.estimatedCost}\``;

    await ctx.reply(response, { parse_mode: 'Markdown' });

    logger.info(`Gas estimate: ${from} -> ${to} on Casper`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Gas estimation failed:', error);
    
    await ctx.reply(`❌ Gas estimation failed\n\n${errorMessage}`);
  }
}
