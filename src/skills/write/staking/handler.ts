import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  bond, delegate, unbond, undelegate, withdrawRewards, setCommissionRate,
} from '../../../services/casperTransactionService';
import { createDeploySuccessText, checkSigningKey } from '../deployHelper';

function validatePublicKey(key: string): boolean {
  return /^[0-9a-fA-F]{68}$/.test(key);
}

export async function handleBondCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /bond <amount> [delegator_rate]\n\nBond CSPR to become a validator (self-stake).');
    return;
  }

  try {
    const amount = args[0];
    const delegatorRate = args[1] ? parseInt(args[1]) : undefined;

    const { deployHash, result } = await bond(amount, delegatorRate);
    const fields: { name: string; value: string }[] = [{ name: 'Amount', value: `${amount} CSPR` }];
    if (delegatorRate !== undefined) fields.push({ name: 'Delegator Rate', value: `${delegatorRate}%` });

    const response = createDeploySuccessText('Bond (Self-Stake)', deployHash, result, fields);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Bond successful: ${deployHash}`);
  } catch (error) {
    logger.error('Bond failed:', error);
    await ctx.reply(`❌ Bond failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleDelegateCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /delegate <validator_public_key> <amount>\n\nDelegate CSPR to a validator.');
    return;
  }

  try {
    const validator = args[0];
    const amount = args[1];

    if (!validatePublicKey(validator)) {
      await ctx.reply('❌ Invalid validator public key.');
      return;
    }

    const { deployHash, result } = await delegate(validator, amount);
    const response = createDeploySuccessText('Delegate', deployHash, result, [
      { name: 'Validator', value: `\`${validator.substring(0, 20)}...\`` },
      { name: 'Amount', value: `${amount} CSPR` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Delegate successful: ${deployHash}`);
  } catch (error) {
    logger.error('Delegate failed:', error);
    await ctx.reply(`❌ Delegate failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleUnbondCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /unbond <amount>\n\nUnbond your self-staked CSPR.');
    return;
  }

  try {
    const amount = args[0];
    const { deployHash, result } = await unbond(amount);
    const response = createDeploySuccessText('Unbond', deployHash, result, [
      { name: 'Amount', value: `${amount} CSPR` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Unbond successful: ${deployHash}`);
  } catch (error) {
    logger.error('Unbond failed:', error);
    await ctx.reply(`❌ Unbond failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleUndelegateCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /undelegate <validator_public_key> <amount>\n\nWithdraw delegation from a validator.');
    return;
  }

  try {
    const validator = args[0];
    const amount = args[1];

    if (!validatePublicKey(validator)) {
      await ctx.reply('❌ Invalid validator public key.');
      return;
    }

    const { deployHash, result } = await undelegate(validator, amount);
    const response = createDeploySuccessText('Undelegate', deployHash, result, [
      { name: 'Validator', value: `\`${validator.substring(0, 20)}...\`` },
      { name: 'Amount', value: `${amount} CSPR` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Undelegate successful: ${deployHash}`);
  } catch (error) {
    logger.error('Undelegate failed:', error);
    await ctx.reply(`❌ Undelegate failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleWithdrawRewardsCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  try {
    const { deployHash, result } = await withdrawRewards();
    const response = createDeploySuccessText('Withdraw Rewards', deployHash, result);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Withdraw rewards successful: ${deployHash}`);
  } catch (error) {
    logger.error('Withdraw rewards failed:', error);
    await ctx.reply(`❌ Withdraw rewards failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleSetCommissionRateCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /set-commission-rate <rate>\n\nSet validator commission rate (for validators only). Rate: 0-100.');
    return;
  }

  try {
    const rate = parseInt(args[0]);

    if (isNaN(rate) || rate < 0 || rate > 100) {
      await ctx.reply('❌ Rate must be between 0 and 100.');
      return;
    }

    const { deployHash, result } = await setCommissionRate(rate);
    const response = createDeploySuccessText('Set Commission Rate', deployHash, result, [
      { name: 'New Rate', value: `${rate}%` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Set commission rate successful: ${deployHash}`);
  } catch (error) {
    logger.error('Set commission rate failed:', error);
    await ctx.reply(`❌ Set commission rate failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
