import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { nftWriteCommands } from './commands';
import {
  handleNftMintCommand,
  handleNftMintCopiesCommand,
  handleNftBurnCommand,
  handleNftTransferCommand,
  handleNftApproveCommand,
  handleNftTransferFromCommand,
  handleNftSetMetadataCommand,
  handleNftBatchTransferCommand,
  handleNftBatchBurnCommand,
  handleNftSetAdminCommand,
} from './handler';

/**
 * NFT Write Skill
 *
 * Handles NFT (CEP-47 / CEP-78) write operations:
 * - Mint single / batch copies
 * - Burn / Batch burn
 * - Transfer / Transfer from
 * - Approve
 * - Set metadata (CEP-78)
 * - Batch transfer (CEP-78)
 * - Set admin (CEP-78)
 */
export class NftWriteSkill extends BaseSkill {
  constructor() {
    super({
      name: 'nft-write',
      version: '1.0.0',
      description: 'CEP-47/CEP-78 NFT write operations (mint, burn, transfer, metadata)',
      author: 'Casper Team',
      commands: nftWriteCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'nft-mint':
        await handleNftMintCommand(ctx);
        break;
      case 'nft-mint-copies':
        await handleNftMintCopiesCommand(ctx);
        break;
      case 'nft-burn':
        await handleNftBurnCommand(ctx);
        break;
      case 'nft-transfer':
        await handleNftTransferCommand(ctx);
        break;
      case 'nft-approve':
        await handleNftApproveCommand(ctx);
        break;
      case 'nft-transfer-from':
        await handleNftTransferFromCommand(ctx);
        break;
      case 'nft-set-metadata':
        await handleNftSetMetadataCommand(ctx);
        break;
      case 'nft-batch-transfer':
        await handleNftBatchTransferCommand(ctx);
        break;
      case 'nft-batch-burn':
        await handleNftBatchBurnCommand(ctx);
        break;
      case 'nft-set-admin':
        await handleNftSetAdminCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
