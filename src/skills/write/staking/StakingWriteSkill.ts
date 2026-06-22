import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { stakingWriteCommands } from './commands';
import {
  handleBondCommand,
  handleDelegateCommand,
  handleUnbondCommand,
  handleUndelegateCommand,
  handleWithdrawRewardsCommand,
  handleSetCommissionRateCommand,
} from './handler';

/**
 * Staking Write Skill
 *
 * Handles staking / consensus protocol write operations:
 * - Bond (self-stake to become validator)
 * - Delegate (delegate to validator)
 * - Unbond (withdraw self-stake)
 * - Undelegate (withdraw delegation)
 * - Withdraw rewards
 * - Set commission rate
 */
export class StakingWriteSkill extends BaseSkill {
  constructor() {
    super({
      name: 'staking-write',
      version: '1.0.0',
      description: 'Casper staking/consensus write operations (bond, delegate, unbond)',
      author: 'Casper Team',
      commands: stakingWriteCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'bond':
        await handleBondCommand(ctx);
        break;
      case 'delegate':
        await handleDelegateCommand(ctx);
        break;
      case 'unbond':
        await handleUnbondCommand(ctx);
        break;
      case 'undelegate':
        await handleUndelegateCommand(ctx);
        break;
      case 'withdraw-rewards':
        await handleWithdrawRewardsCommand(ctx);
        break;
      case 'set-commission-rate':
        await handleSetCommissionRateCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
