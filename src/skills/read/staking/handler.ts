import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  getEraValidators,
  getAuctionInfo,
  getValidatorChangesInfo,
  getEraSummary,
} from '../../../services/casperRpcService';
import {
  createReadText,
  createErrorText,
  truncate,
  motesToCspr,
  validatePublicKey,
} from '../readHelper';

/**
 * Handle /era-validators command
 */
export async function handleEraValidatorsCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  try {
    const blockHash = args[0] || undefined;
    const result = await getEraValidators(blockHash);
    const eraValidators = result?.era_validators || [];

    if (eraValidators.length === 0) {
      await ctx.reply(createErrorText('No Validators', 'No validators found for this era'));
      return;
    }

    const topValidators = eraValidators
      .map((ev: any) => {
        const validators = ev.validator_weights || [];
        return validators.map((v: any) => ({
          publicKey: v.public_key,
          weight: v.weight,
        }));
      })
      .flat()
      .sort((a: any, b: any) => {
        const aVal = parseFloat(a.weight || '0');
        const bVal = parseFloat(b.weight || '0');
        return bVal - aVal;
      })
      .slice(0, 10);

    const validatorList = topValidators
      .map((v: any, i: number) => {
        const weightCspr = motesToCspr(v.weight);
        return `${i + 1}. \`${truncate(v.publicKey, 30)}\`\n   Stake: ${weightCspr} CSPR`;
      })
      .join('\n\n');

    const response = createReadText('⚖️ Era Validators', [
      { name: 'Era ID', value: result?.era_id?.toString() || 'N/A' },
      { name: 'Total Validator Sets', value: eraValidators.length.toString() },
      { name: 'Top 10 Validators', value: validatorList },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Era validators query successful');
  } catch (error) {
    logger.error('Era validators query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /validator-detail command
 */
export async function handleValidatorDetailCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /validator-detail <public_key>\n\nQuery detailed information about a single validator.');
    return;
  }

  try {
    const publicKey = args[0];

    if (!validatePublicKey(publicKey)) {
      await ctx.reply(createErrorText('Invalid Public Key', 'Public key must be 68 hex chars'));
      return;
    }

    const result = await getAuctionInfo();
    const bids = result?.auction_state?.bids || [];

    const validatorBid = bids.find((b: any) => b.public_key === publicKey);

    if (!validatorBid) {
      await ctx.reply(createErrorText('Validator Not Found', 'No bid found for this public key'));
      return;
    }

    const bid = validatorBid.bid || {};
    const stakedAmount = motesToCspr(bid.staked_amount || '0');
    const delegationRate = bid.delegation_rate?.toString() || 'N/A';
    const vestingSchedule = bid.vesting_schedule ? 'Yes' : 'No';
    const inactive = bid.inactive ? 'Yes' : 'No';

    const delegators = bid.delegators || [];
    const totalDelegated = delegators.reduce((sum: number, d: any) => {
      return sum + parseFloat(d.staked_amount || '0');
    }, 0);
    const totalDelegatedCspr = motesToCspr(totalDelegated.toString());

    let response = createReadText('⚖️ Validator Details', [
      { name: 'Public Key', value: `\`${truncate(publicKey, 45)}\`` },
      { name: 'Staked Amount', value: `${stakedAmount} CSPR` },
      { name: 'Delegation Rate', value: `${delegationRate}%` },
      { name: 'Inactive', value: inactive },
      { name: 'Vesting Schedule', value: vestingSchedule },
      { name: 'Delegator Count', value: delegators.length.toString() },
      { name: 'Total Delegated', value: `${totalDelegatedCspr} CSPR` },
    ]);

    // Show top 5 delegators if any
    if (delegators.length > 0) {
      const topDelegators = delegators
        .sort((a: any, b: any) => parseFloat(b.staked_amount || '0') - parseFloat(a.staked_amount || '0'))
        .slice(0, 5);

      const delegatorList = topDelegators
        .map((d: any, i: number) => {
          const amount = motesToCspr(d.staked_amount);
          return `${i + 1}. \`${truncate(d.public_key, 30)}\`\n   Delegated: ${amount} CSPR`;
        })
        .join('\n\n');

      response += `\n*Top 5 Delegators:*\n${delegatorList}\n`;
    }

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Validator detail query successful');
  } catch (error) {
    logger.error('Validator detail query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /delegation command
 */
export async function handleDelegationCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /delegation <delegator_public_key> [validator_public_key]\n\nQuery delegation information for a delegator.');
    return;
  }

  try {
    const delegator = args[0];
    const validator = args[1] || undefined;

    if (!validatePublicKey(delegator)) {
      await ctx.reply(createErrorText('Invalid Public Key', 'Delegator key must be 68 hex chars'));
      return;
    }

    const result = await getAuctionInfo();
    const bids = result?.auction_state?.bids || [];

    const delegations: { validator: string; amount: string }[] = [];

    for (const bid of bids) {
      const delegators = bid.bid?.delegators || [];
      for (const d of delegators) {
        if (d.public_key === delegator) {
          if (!validator || bid.public_key === validator) {
            delegations.push({
              validator: bid.public_key,
              amount: d.staked_amount || '0',
            });
          }
        }
      }
    }

    if (delegations.length === 0) {
      await ctx.reply(createErrorText('No Delegations', 'No delegation records found for this account'));
      return;
    }

    const delegationList = delegations
      .map((d, i) => {
        const amount = motesToCspr(d.amount);
        return `${i + 1}. Validator: \`${truncate(d.validator, 30)}\`\n   Amount: ${amount} CSPR`;
      })
      .join('\n\n');

    const totalDelegated = delegations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

    const response = createReadText('⚖️ Delegation Info', [
      { name: 'Delegator', value: `\`${truncate(delegator, 45)}\`` },
      { name: 'Total Delegations', value: delegations.length.toString() },
      { name: 'Total Delegated', value: `${motesToCspr(totalDelegated.toString())} CSPR` },
      { name: 'Delegation Details', value: delegationList },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Delegation query successful');
  } catch (error) {
    logger.error('Delegation query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /auction-info command
 */
export async function handleAuctionInfoCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  try {
    const blockHash = args[0] || undefined;
    const result = await getAuctionInfo(blockHash);
    const auctionState = result?.auction_state || {};

    const bids = auctionState.bids || [];
    const activeBids = bids.filter((b: any) => b.bid && !b.bid.inactive);
    const totalStaked = activeBids.reduce((sum: number, b: any) => {
      return sum + parseFloat(b.bid?.staked_amount || '0');
    }, 0);

    const response = createReadText('⚖️ Auction State', [
      { name: 'Era ID', value: auctionState.era_id?.toString() || 'N/A' },
      { name: 'State Root Hash', value: `\`${truncate(auctionState.state_root_hash, 30)}\`` },
      { name: 'Total Bids', value: bids.length.toString() },
      { name: 'Active Bids', value: activeBids.length.toString() },
      { name: 'Total Staked', value: `${motesToCspr(totalStaked.toString())} CSPR` },
      { name: 'Block Height', value: auctionState.block_height?.toString() || 'N/A' },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Auction info query successful');
  } catch (error) {
    logger.error('Auction info query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /validator-changes command
 */
export async function handleValidatorChangesCommand(ctx: Context) {
  try {
    const result = await getValidatorChangesInfo();
    const changes = result?.changes || [];

    if (changes.length === 0) {
      const response = createReadText('⚖️ Validator Changes', [
        { name: 'Status', value: 'No recent validator changes' },
      ]);
      await ctx.reply(response, { parse_mode: 'Markdown' });
      return;
    }

    const changesList = changes
      .slice(0, 10)
      .map((c: any, i: number) => {
        const publicKey = truncate(c.public_key, 35);
        const type = c.change_type || {};
        const changeStr = type.Activated ? 'Activated' : type.Deactivated ? 'Deactivated' : 'Changed';
        return `${i + 1}. \`${publicKey}\`\n   Type: ${changeStr}`;
      })
      .join('\n\n');

    const response = createReadText('⚖️ Validator Changes', [
      { name: 'Total Changes', value: changes.length.toString() },
      { name: 'Recent Changes (Top 10)', value: changesList },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Validator changes query successful');
  } catch (error) {
    logger.error('Validator changes query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /era-summary command
 */
export async function handleEraSummaryCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  try {
    const blockHash = args[0] || undefined;
    const result = await getEraSummary(blockHash);
    const eraSummary = result?.era_summary || {};

    const rewards = eraSummary.seigniorage_allocations || [];
    const totalReward = rewards.reduce((sum: number, r: any) => {
      return sum + parseFloat(r.amount || '0');
    }, 0);

    let response = createReadText('📅 Era Summary', [
      { name: 'Era ID', value: eraSummary.era_id?.toString() || 'N/A' },
      { name: 'Block Hash', value: `\`${truncate(eraSummary.block_hash, 30)}\`` },
      { name: 'State Root Hash', value: `\`${truncate(eraSummary.state_root_hash, 30)}\`` },
      { name: 'Total Rewards', value: `${motesToCspr(totalReward.toString())} CSPR` },
      { name: 'Reward Recipients', value: rewards.length.toString() },
    ]);

    // Show top 5 reward recipients
    if (rewards.length > 0) {
      const topRewards = rewards
        .sort((a: any, b: any) => parseFloat(b.amount || '0') - parseFloat(a.amount || '0'))
        .slice(0, 5);

      const rewardList = topRewards
        .map((r: any, i: number) => {
          const amount = motesToCspr(r.amount);
          const recipient = r.Validator ? `Validator: \`${truncate(r.Validator, 25)}\`` : `Delegator: \`${truncate(r.Delegator, 25)}\``;
          return `${i + 1}. ${recipient}\n   Reward: ${amount} CSPR`;
        })
        .join('\n\n');

      response += `\n*Top 5 Reward Recipients:*\n${rewardList}\n`;
    }

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Era summary query successful');
  } catch (error) {
    logger.error('Era summary query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}
