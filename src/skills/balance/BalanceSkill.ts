import { BaseSkill } from '../../skills/BaseSkill';
import { Context } from 'telegraf';
import { balanceCommands } from './commands';
import { handleBalanceCommand } from './handler';

/**
 * Balance Skill
 * 
 * Provides wallet balance query functionality for Casper blockchain.
 */
export class BalanceSkill extends BaseSkill {
  constructor() {
    super({
      name: 'balance',
      version: '1.0.0',
      description: 'Query wallet balance on Casper blockchain',
      author: 'Casper Team',
      commands: balanceCommands,
    });
  }
  
  async handleCommand(ctx: Context): Promise<void> {
    await handleBalanceCommand(ctx);
  }
}
