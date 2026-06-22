import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { nativeWriteCommands } from './commands';
import {
  handleTransferCommand,
  handleCreatePurseCommand,
  handleAddKeyCommand,
  handleRemoveKeyCommand,
  handleSetThresholdCommand,
  handlePutNamedKeyCommand,
} from './handler';

/**
 * Native CSPR Write Skill
 *
 * Handles native blockchain write operations:
 * - CSPR transfers
 * - Purse creation
 * - Account key management (add/remove associated keys)
 * - Action threshold configuration
 * - Named key binding
 */
export class NativeWriteSkill extends BaseSkill {
  constructor() {
    super({
      name: 'native-write',
      version: '1.0.0',
      description: 'Native CSPR blockchain write operations (transfers, keys, purses)',
      author: 'Casper Team',
      commands: nativeWriteCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'transfer':
        await handleTransferCommand(ctx);
        break;
      case 'create-purse':
        await handleCreatePurseCommand(ctx);
        break;
      case 'add-key':
        await handleAddKeyCommand(ctx);
        break;
      case 'remove-key':
        await handleRemoveKeyCommand(ctx);
        break;
      case 'set-threshold':
        await handleSetThresholdCommand(ctx);
        break;
      case 'put-named-key':
        await handlePutNamedKeyCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
