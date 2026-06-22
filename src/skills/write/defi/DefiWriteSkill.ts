import { BaseSkill } from '../../BaseSkill';
import { Context } from 'telegraf';
import { defiWriteCommands } from './commands';
import {
  handleSwapCommand,
  handleAddLiquidityCommand,
  handleRemoveLiquidityCommand,
  handleStakeLpCommand,
  handleClaimRewardCommand,
  handleCreateOrderCommand,
  handleCancelOrderCommand,
  handleCounterIncrementCommand,
  handleCounterDecrementCommand,
  handleDictPutCommand,
  handleDictRemoveCommand,
  handleCreateProposalCommand,
  handleCastVoteCommand,
  handleExecuteProposalCommand,
  handleSaveAssetCommand,
  handleCallContractCommand,
} from './handler';

/**
 * DeFi & DApp Write Skill
 *
 * Handles DeFi AMM/liquidity and general DApp write operations:
 *
 * DeFi:
 * - Swap, Add/Remove Liquidity, Stake LP, Claim Reward
 * - Create/Cancel Order
 *
 * DApp:
 * - Counter Increment/Decrement
 * - Dictionary Put/Remove
 * - Governance: Create Proposal, Cast Vote, Execute Proposal
 * - RWA: Save Asset Record
 * - Generic Contract Call
 */
export class DefiWriteSkill extends BaseSkill {
  constructor() {
    super({
      name: 'defi-dapp-write',
      version: '1.0.0',
      description: 'DeFi AMM, liquidity, governance, and general DApp write operations',
      author: 'Casper Team',
      commands: defiWriteCommands,
    });
  }

  async handleCommand(ctx: Context): Promise<void> {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].substring(1);

    switch (commandName) {
      case 'swap':
        await handleSwapCommand(ctx);
        break;
      case 'add-liquidity':
        await handleAddLiquidityCommand(ctx);
        break;
      case 'remove-liquidity':
        await handleRemoveLiquidityCommand(ctx);
        break;
      case 'stake-lp':
        await handleStakeLpCommand(ctx);
        break;
      case 'claim-reward':
        await handleClaimRewardCommand(ctx);
        break;
      case 'create-order':
        await handleCreateOrderCommand(ctx);
        break;
      case 'cancel-order':
        await handleCancelOrderCommand(ctx);
        break;
      case 'counter-increment':
        await handleCounterIncrementCommand(ctx);
        break;
      case 'counter-decrement':
        await handleCounterDecrementCommand(ctx);
        break;
      case 'dict-put':
        await handleDictPutCommand(ctx);
        break;
      case 'dict-remove':
        await handleDictRemoveCommand(ctx);
        break;
      case 'create-proposal':
        await handleCreateProposalCommand(ctx);
        break;
      case 'cast-vote':
        await handleCastVoteCommand(ctx);
        break;
      case 'execute-proposal':
        await handleExecuteProposalCommand(ctx);
        break;
      case 'save-asset':
        await handleSaveAssetCommand(ctx);
        break;
      case 'call-contract':
        await handleCallContractCommand(ctx);
        break;
      default:
        await ctx.reply(`❌ Unknown command: ${commandName}`);
    }
  }
}
