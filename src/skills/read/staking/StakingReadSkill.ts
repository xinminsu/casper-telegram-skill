import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { stakingReadCommands } from './commands';
import {
  handleEraValidatorsCommand,
  handleValidatorDetailCommand,
  handleDelegationCommand,
  handleAuctionInfoCommand,
  handleValidatorChangesCommand,
  handleEraSummaryCommand,
} from './handler';

/**
 * Staking Read Skill
 *
 * Read-only queries for Casper staking and consensus information:
 * - Era validators listing
 * - Single validator detail (stake, delegation rate, delegators)
 * - Delegation info for a delegator
 * - Full auction state
 * - Validator set changes
 * - Era summary with rewards
 */
export class StakingReadSkill extends BaseSkill {
  constructor() {
    super({
      name: 'staking-read',
      version: '1.0.0',
      description: 'Query Casper staking, validators, and consensus information (read-only)',
      author: 'Casper Team',
      commands: stakingReadCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'era-validators':
        await handleEraValidatorsCommand(ctx);
        break;
      case 'validator-detail':
        await handleValidatorDetailCommand(ctx);
        break;
      case 'delegation':
        await handleDelegationCommand(ctx);
        break;
      case 'auction-info':
        await handleAuctionInfoCommand(ctx);
        break;
      case 'validator-changes':
        await handleValidatorChangesCommand(ctx);
        break;
      case 'era-summary':
        await handleEraSummaryCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
