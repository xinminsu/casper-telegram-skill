import { Context } from 'telegraf';
import { ethers } from 'ethers';
import { getEthBalance, getTokenBalance } from '../../services/web3Service';
import { logger } from '../../utils/logger';

export async function handleBalanceCommand(ctx: Context) {
  // Get command arguments from message text
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1); // Remove command name
  
  if (args.length < 1) {
    await ctx.reply('❌ Usage: /balance <address> [token_address]');
    return;
  }

  const address = args[0];
  const token = args[1];

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    const length = address.length;
    const expectedLength = 42;
    await ctx.reply(
      `❌ Invalid wallet address format\n\n` +
      `Expected: 42 characters (0x + 40 hex chars)\n` +
      `Received: ${length} characters\n\n` +
      `Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1`
    );
    return;
  }

  try {
    // Convert addresses to checksum format to avoid checksum errors
    const checksumAddress = ethers.getAddress(address.toLowerCase());
    
    let balanceInfo: string;
    let title: string;

    if (token) {
      // Query ERC20 token balance
      if (!/^0x[a-fA-F0-9]{40}$/.test(token)) {
        await ctx.reply('❌ Invalid token contract address format. Must be 42 characters (0x + 40 hex chars)');
        return;
      }
      
      // Convert token address to checksum format
      const checksumToken = ethers.getAddress(token.toLowerCase());
      balanceInfo = await getTokenBalance(checksumToken, checksumAddress);
      title = `💰 Casper Token Balance`;
    } else {
      // Query ETH balance
      balanceInfo = await getEthBalance(checksumAddress);
      title = `💰 Casper ETH Balance`;
    }

    const response = 
      `${title}\n\n` +
      `*Wallet Address:* \`${checksumAddress}\`\n` +
      `*Balance:* \`${balanceInfo}\`\n` +
      `*Network:* Casper`;

    await ctx.reply(response, { parse_mode: 'Markdown' });

    logger.info(`Query balance: ${checksumAddress} on Casper`);
  } catch (error) {
    logger.error('Balance query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
