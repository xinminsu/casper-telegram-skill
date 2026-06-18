import { BaseSkill } from '../../skills/BaseSkill';
import { Context } from 'telegraf';
import { gasCommands } from './commands';
import { handleGasPriceCommand, handleGasEstimateCommand } from './handler';

/**
 * Gas Skill
 * 
 * Provides gas price queries and transaction estimation for Casper blockchain.
 */
export class GasSkill extends BaseSkill {
  constructor() {
    super({
      name: 'gas',
      version: '1.0.0',
      description: 'Query gas prices and estimate transaction fees on Casper',
      author: 'Casper Team',
      commands: gasCommands,
    });
  }
  
  async handleCommand(ctx: Context): Promise<void> {
    // Get command name from message text
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].replace('/', '');
    
    switch (commandName) {
      case 'gas-price':
        await handleGasPriceCommand(ctx);
        break;
      case 'gas-estimate':
        await handleGasEstimateCommand(ctx);
        break;
      default:
        throw new Error(`Unknown command: ${commandName}`);
    }
  }
}
