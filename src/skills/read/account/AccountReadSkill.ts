import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { accountReadCommands } from './commands';
import {
  handleAccountInfoCommand,
  handlePurseBalanceCommand,
  handleNamedKeysCommand,
  handleAccountBalanceCommand,
  handlePurseDetailsCommand,
  handleGlobalStateCommand,
} from './handler';

/**
 * Account Read Skill
 *
 * Read-only queries for Casper account and asset information:
 * - Account info (keys, purses, thresholds)
 * - Purse balance queries
 * - Named keys listing
 * - Account CSPR balance
 * - Purse balance with full details
 * - Global state queries
 */
export class AccountReadSkill extends BaseSkill {
  constructor() {
    super({
      name: 'account-read',
      version: '1.0.0',
      description: 'Query Casper account, balance, and asset information (read-only)',
      author: 'Casper Team',
      commands: accountReadCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'account-info':
        await handleAccountInfoCommand(ctx);
        break;
      case 'purse-balance':
        await handlePurseBalanceCommand(ctx);
        break;
      case 'named-keys':
        await handleNamedKeysCommand(ctx);
        break;
      case 'account-balance':
        await handleAccountBalanceCommand(ctx);
        break;
      case 'purse-details':
        await handlePurseDetailsCommand(ctx);
        break;
      case 'global-state':
        await handleGlobalStateCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
