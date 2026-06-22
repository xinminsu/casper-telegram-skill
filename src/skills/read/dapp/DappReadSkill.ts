import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { dappReadCommands } from './commands';
import {
  handleCounterValueCommand,
  handleAmmReservesCommand,
  handleAmmLpBalanceCommand,
  handleAmmStakeInfoCommand,
  handleAllProposalsCommand,
  handleProposalDetailCommand,
  handleVoteRecordCommand,
  handleAssetRecordCommand,
  handleOpenOrdersCommand,
} from './handler';

/**
 * DApp Read Skill
 *
 * Read-only queries for general DApp business logic:
 * - Counter: query current count value
 * - AMM: pool reserves, LP balance, staking info
 * - Governance: all proposals, proposal detail, vote record
 * - RWA: asset record query
 * - DEX: open orders query
 */
export class DappReadSkill extends BaseSkill {
  constructor() {
    super({
      name: 'dapp-read',
      version: '1.0.0',
      description: 'Query DApp business data: counter, AMM, governance, RWA, DEX orders (read-only)',
      author: 'Casper Team',
      commands: dappReadCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'counter-value':
        await handleCounterValueCommand(ctx);
        break;
      case 'amm-reserves':
        await handleAmmReservesCommand(ctx);
        break;
      case 'amm-lp-balance':
        await handleAmmLpBalanceCommand(ctx);
        break;
      case 'amm-stake-info':
        await handleAmmStakeInfoCommand(ctx);
        break;
      case 'all-proposals':
        await handleAllProposalsCommand(ctx);
        break;
      case 'proposal-detail':
        await handleProposalDetailCommand(ctx);
        break;
      case 'vote-record':
        await handleVoteRecordCommand(ctx);
        break;
      case 'asset-record':
        await handleAssetRecordCommand(ctx);
        break;
      case 'open-orders':
        await handleOpenOrdersCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
