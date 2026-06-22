import { BaseSkill } from '../BaseSkill';
import { Context } from 'telegraf';
import { networkCommands } from './commands';
import {
  handleNodeStatusCommand,
  handlePeersCommand,
  handleBlockCommand,
  handleDeployCommand,
  handleValidatorsCommand,
  handleEraCommand,
  handleStateRootHashCommand,
  handleTransfersCommand,
  handleChainspecCommand,
} from './handler';

/**
 * Network Skill
 *
 * Provides Casper blockchain network query functionality:
 * - Node status, Network peers, Block information
 * - Deploy/transaction info, Validators/auction info
 * - Era information, State root hash, Block transfers, Chainspec
 */
export class NetworkSkill extends BaseSkill {
  constructor() {
    super({
      name: 'network',
      version: '1.0.0',
      description: 'Query Casper blockchain network information',
      author: 'Casper Team',
      commands: networkCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1); // Remove '/' prefix

    switch (commandName) {
      case 'node-status':
        await handleNodeStatusCommand(ctx);
        break;
      case 'peers':
        await handlePeersCommand(ctx);
        break;
      case 'block':
        await handleBlockCommand(ctx);
        break;
      case 'deploy':
        await handleDeployCommand(ctx);
        break;
      case 'validators':
        await handleValidatorsCommand(ctx);
        break;
      case 'era':
        await handleEraCommand(ctx);
        break;
      case 'state-root-hash':
        await handleStateRootHashCommand(ctx);
        break;
      case 'transfers':
        await handleTransfersCommand(ctx);
        break;
      case 'chainspec':
        await handleChainspecCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
