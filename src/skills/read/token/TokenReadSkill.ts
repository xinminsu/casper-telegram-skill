import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { tokenReadCommands } from './commands';
import {
  handleTokenTotalSupplyCommand,
  handleTokenBalanceCommand,
  handleTokenAllowanceCommand,
  handleTokenMetaCommand,
  handleNftTotalSupplyCommand,
  handleNftOwnerOfCommand,
  handleNftTokensOfCommand,
  handleNftMetadataCommand,
  handleNftApprovedCommand,
  handleNftMaxSupplyCommand,
  handleNftBatchOwnersCommand,
} from './handler';

/**
 * Token Read Skill
 *
 * Read-only queries for CEP-18 fungible tokens and CEP-47/CEP-78 NFTs:
 * - CEP-18: total_supply, balance_of, allowance, name/symbol/decimals
 * - CEP-47/78: total_supply, owner_of, tokens_of_owner, metadata, approved, max_supply, batch_owners
 */
export class TokenReadSkill extends BaseSkill {
  constructor() {
    super({
      name: 'token-read',
      version: '1.0.0',
      description: 'Query CEP-18 fungible tokens and CEP-47/78 NFT information (read-only)',
      author: 'Casper Team',
      commands: tokenReadCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'token-total-supply':
        await handleTokenTotalSupplyCommand(ctx);
        break;
      case 'token-balance':
        await handleTokenBalanceCommand(ctx);
        break;
      case 'token-allowance':
        await handleTokenAllowanceCommand(ctx);
        break;
      case 'token-meta':
        await handleTokenMetaCommand(ctx);
        break;
      case 'nft-total-supply':
        await handleNftTotalSupplyCommand(ctx);
        break;
      case 'nft-owner-of':
        await handleNftOwnerOfCommand(ctx);
        break;
      case 'nft-tokens-of':
        await handleNftTokensOfCommand(ctx);
        break;
      case 'nft-metadata':
        await handleNftMetadataCommand(ctx);
        break;
      case 'nft-approved':
        await handleNftApprovedCommand(ctx);
        break;
      case 'nft-max-supply':
        await handleNftMaxSupplyCommand(ctx);
        break;
      case 'nft-batch-owners':
        await handleNftBatchOwnersCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
