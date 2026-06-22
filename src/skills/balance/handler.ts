import { Context } from 'telegraf';
import { ethers } from 'ethers';
import { getEthBalance, getTokenBalance } from '../../services/web3Service';
import { CasperAddressUtils } from '../../utils/casperAddress';
import { logger } from '../../utils/logger';

export async function handleBalanceCommand(ctx: Context) {
  // Get command arguments from message text
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1); // Remove command name
  
  if (args.length < 1) {
    await ctx.reply(
      '❌ Usage: /balance <address> [token_address]\n\n' +
      'Supported address formats:\n' +
      '• Ethereum-style: 0x...\n' +
      '• Casper account hash: account-hash-...\n' +
      '• Casper public key: 02/03... (66 chars)'
    );
    return;
  }

  const address = args[0];
  const token = args[1];

  // Detect and validate address format
  const addressType = CasperAddressUtils.getAddressType(address);
  
  if (addressType === 'unknown') {
    await ctx.reply(
      `❌ Invalid address format: ${address}\n\n` +
      `Supported formats:\n` +
      `• Ethereum-style: 0x followed by 40 hex chars\n` +
      `• Casper account hash: account-hash-...\n` +
      `• Casper public key: 02/03 followed by 64 hex chars`
    );
    return;
  }

  try {
    // Normalize address for blockchain queries
    const normalizedAddress = CasperAddressUtils.normalizeAddress(address);
    
    let balanceInfo: string;
    let title: string;

    if (token) {
      // Query ERC20 token balance
      if (!CasperAddressUtils.isEthereumStyle(token) && 
          !CasperAddressUtils.isAccountHash(token) && 
          !CasperAddressUtils.isPublicKeyHex(token)) {
        await ctx.reply('❌ Invalid token contract address format');
        return;
      }
      
      // Convert token address to normalized format
      const normalizedToken = CasperAddressUtils.normalizeAddress(token);
      balanceInfo = await getTokenBalance(normalizedToken, normalizedAddress);
      title = `💰 Casper Token Balance`;
    } else {
      // Query ETH balance
      balanceInfo = await getEthBalance(normalizedAddress);
      title = `💰 Casper CSPR Balance`;
    }

    // Build response with address format information
    let response = `${title}\n\n`;
    
    // Show original address and type
    response += `*Original Address:* \`${address}\`\n`;
    response += `*Address Type:* ${addressType}\n\n`;
    
    // Show converted formats if different
    if (addressType !== 'account-hash') {
      response += `*Casper Account Hash:* \`${normalizedAddress}\`\n\n`;
    }
    
    response += `*Balance:* \`${balanceInfo}\`\n`;
    response += `*Network:* Casper`;

    await ctx.reply(response, { parse_mode: 'Markdown' });

    logger.info(`Query balance: ${address} (${addressType}) on Casper`);
  } catch (error) {
    logger.error('Balance query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
