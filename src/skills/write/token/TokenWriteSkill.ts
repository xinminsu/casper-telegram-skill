import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { tokenWriteCommands } from './commands';
import {
  handleMintCommand,
  handleBurnCommand,
  handleTokenTransferCommand,
  handleApproveCommand,
  handleIncreaseAllowanceCommand,
  handleDecreaseAllowanceCommand,
  handleTransferFromCommand,
} from './handler';

/**
 * CEP-18 Token Write Skill
 *
 * Handles fungible token (CEP-18 standard) write operations:
 * - Mint / Burn tokens
 * - Transfer tokens
 * - Approve / Increase / Decrease allowance
 * - Transfer from (approved spender)
 */
export class TokenWriteSkill extends BaseSkill {
  constructor() {
    super({
      name: 'token-write',
      version: '1.0.0',
      description: 'CEP-18 fungible token write operations (mint, burn, transfer, approve)',
      author: 'Casper Team',
      commands: tokenWriteCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'mint':
        await handleMintCommand(ctx);
        break;
      case 'burn':
        await handleBurnCommand(ctx);
        break;
      case 'token-transfer':
        await handleTokenTransferCommand(ctx);
        break;
      case 'approve':
        await handleApproveCommand(ctx);
        break;
      case 'increase-allowance':
        await handleIncreaseAllowanceCommand(ctx);
        break;
      case 'decrease-allowance':
        await handleDecreaseAllowanceCommand(ctx);
        break;
      case 'transfer-from':
        await handleTransferFromCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
