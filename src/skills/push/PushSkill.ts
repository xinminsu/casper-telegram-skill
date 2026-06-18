import { BaseSkill } from '../../skills/BaseSkill';
import { Context } from 'telegraf';
import { pushCommands } from './commands';
import { handlePushCommand } from './handler';

/**
 * Push Skill
 * 
 * Provides message push functionality to Telegram chats.
 */
export class PushSkill extends BaseSkill {
  constructor() {
    super({
      name: 'push',
      version: '1.0.0',
      description: 'Push notification messages to Telegram chats',
      author: 'Casper Team',
      commands: pushCommands,
    });
  }
  
  async handleCommand(ctx: Context): Promise<void> {
    await handlePushCommand(ctx);
  }
}
