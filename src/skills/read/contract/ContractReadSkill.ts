import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { contractReadCommands } from './commands';
import {
  handleContractInfoCommand,
  handleEntryPointsCommand,
  handleDictItemCommand,
  handleDictByAccountCommand,
  handleDictByContractCommand,
  handleStateItemCommand,
  handleContractNamedKeysCommand,
} from './handler';

/**
 * Contract Read Skill
 *
 * Read-only queries for Casper smart contract information:
 * - Contract metadata (hash, version, entry points)
 * - Contract entry points listing
 * - Dictionary item queries (by URef, by account, by contract)
 * - State item queries
 * - Contract named keys
 */
export class ContractReadSkill extends BaseSkill {
  constructor() {
    super({
      name: 'contract-read',
      version: '1.0.0',
      description: 'Query Casper contract metadata, entry points, and dictionary items (read-only)',
      author: 'Casper Team',
      commands: contractReadCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'contract-info':
        await handleContractInfoCommand(ctx);
        break;
      case 'entry-points':
        await handleEntryPointsCommand(ctx);
        break;
      case 'dict-item':
        await handleDictItemCommand(ctx);
        break;
      case 'dict-by-account':
        await handleDictByAccountCommand(ctx);
        break;
      case 'dict-by-contract':
        await handleDictByContractCommand(ctx);
        break;
      case 'state-item':
        await handleStateItemCommand(ctx);
        break;
      case 'contract-named-keys':
        await handleContractNamedKeysCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
