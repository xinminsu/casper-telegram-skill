import { BaseSkill } from '../../skills/BaseSkill';
import { Context } from 'telegraf';
import { alertCommands } from './commands';
import { handleAlertAdd, handleAlertList, handleAlertRemove } from './handler';
import { startAlertService, stopAlertService } from './scheduler';

/**
 * Alert Skill
 * 
 * Provides blockchain event monitoring and notifications.
 */
export class AlertSkill extends BaseSkill {
  constructor() {
    super({
      name: 'alert',
      version: '1.0.0',
      description: 'Monitor blockchain events and send notifications',
      author: 'Casper Team',
      commands: alertCommands,
    });
  }
  
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Start the alert monitoring service
    startAlertService();
  }
  
  async handleCommand(ctx: Context): Promise<void> {
    // Get command name from message text
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].replace('/', '');
    
    switch (commandName) {
      case 'alert-add':
        await handleAlertAdd(ctx);
        break;
      case 'alert-list':
        await handleAlertList(ctx);
        break;
      case 'alert-remove':
        await handleAlertRemove(ctx);
        break;
      default:
        throw new Error(`Unknown command: ${commandName}`);
    }
  }
  
  async destroy(): Promise<void> {
    // Stop the alert monitoring service
    stopAlertService();
    
    await super.destroy();
  }
}
