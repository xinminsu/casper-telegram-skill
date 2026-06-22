import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  cep18Mint,
  cep18Burn,
  cep18Transfer,
  cep18Approve,
  cep18IncreaseAllowance,
  cep18DecreaseAllowance,
  cep18TransferFrom,
} from '../../../services/casperTransactionService';
import { createDeploySuccessText, checkSigningKey } from '../deployHelper';

function validatePublicKey(key: string): boolean {
  return /^[0-9a-fA-F]{68}$/.test(key);
}

export async function handleMintCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /mint <contract_hash> <owner_public_key> <amount> [decimals]\n\nMint CEP-18 fungible tokens to an account.');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];
    const amount = args[2];
    const decimals = args[3] ? parseInt(args[3]) : 9;

    if (!validatePublicKey(owner)) {
      await ctx.reply('❌ Invalid owner public key. Must be 68 hex chars.');
      return;
    }

    const { deployHash, result } = await cep18Mint(contractHash, owner, amount, decimals);
    const response = createDeploySuccessText('CEP-18 Mint', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Owner', value: `\`${owner.substring(0, 20)}...\`` },
      { name: 'Amount', value: amount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`CEP-18 mint successful: ${deployHash}`);
  } catch (error) {
    logger.error('CEP-18 mint failed:', error);
    await ctx.reply(`❌ Mint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleBurnCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /burn <contract_hash> <owner_public_key> <amount> [decimals]\n\nBurn CEP-18 fungible tokens from an account.');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];
    const amount = args[2];
    const decimals = args[3] ? parseInt(args[3]) : 9;

    if (!validatePublicKey(owner)) {
      await ctx.reply('❌ Invalid owner public key.');
      return;
    }

    const { deployHash, result } = await cep18Burn(contractHash, owner, amount, decimals);
    const response = createDeploySuccessText('CEP-18 Burn', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Owner', value: `\`${owner.substring(0, 20)}...\`` },
      { name: 'Amount', value: amount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`CEP-18 burn successful: ${deployHash}`);
  } catch (error) {
    logger.error('CEP-18 burn failed:', error);
    await ctx.reply(`❌ Burn failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleTokenTransferCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /token-transfer <contract_hash> <recipient_public_key> <amount> [decimals]\n\nTransfer CEP-18 tokens to another account.');
    return;
  }

  try {
    const contractHash = args[0];
    const recipient = args[1];
    const amount = args[2];
    const decimals = args[3] ? parseInt(args[3]) : 9;

    if (!validatePublicKey(recipient)) {
      await ctx.reply('❌ Invalid recipient public key.');
      return;
    }

    const { deployHash, result } = await cep18Transfer(contractHash, recipient, amount, decimals);
    const response = createDeploySuccessText('CEP-18 Transfer', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Recipient', value: `\`${recipient.substring(0, 20)}...\`` },
      { name: 'Amount', value: amount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`CEP-18 transfer successful: ${deployHash}`);
  } catch (error) {
    logger.error('CEP-18 transfer failed:', error);
    await ctx.reply(`❌ Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleApproveCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /approve <contract_hash> <spender_public_key> <amount> [decimals]\n\nApprove a spender for CEP-18 tokens.');
    return;
  }

  try {
    const contractHash = args[0];
    const spender = args[1];
    const amount = args[2];
    const decimals = args[3] ? parseInt(args[3]) : 9;

    if (!validatePublicKey(spender)) {
      await ctx.reply('❌ Invalid spender public key.');
      return;
    }

    const { deployHash, result } = await cep18Approve(contractHash, spender, amount, decimals);
    const response = createDeploySuccessText('CEP-18 Approve', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Spender', value: `\`${spender.substring(0, 20)}...\`` },
      { name: 'Amount', value: amount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`CEP-18 approve successful: ${deployHash}`);
  } catch (error) {
    logger.error('CEP-18 approve failed:', error);
    await ctx.reply(`❌ Approve failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleIncreaseAllowanceCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /increase-allowance <contract_hash> <spender_public_key> <amount> [decimals]\n\nIncrease spending allowance for CEP-18 tokens.');
    return;
  }

  try {
    const contractHash = args[0];
    const spender = args[1];
    const amount = args[2];
    const decimals = args[3] ? parseInt(args[3]) : 9;

    if (!validatePublicKey(spender)) {
      await ctx.reply('❌ Invalid spender public key.');
      return;
    }

    const { deployHash, result } = await cep18IncreaseAllowance(contractHash, spender, amount, decimals);
    const response = createDeploySuccessText('CEP-18 Increase Allowance', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Spender', value: `\`${spender.substring(0, 20)}...\`` },
      { name: 'Amount', value: amount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`CEP-18 increase allowance successful: ${deployHash}`);
  } catch (error) {
    logger.error('CEP-18 increase allowance failed:', error);
    await ctx.reply(`❌ Increase allowance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleDecreaseAllowanceCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /decrease-allowance <contract_hash> <spender_public_key> <amount> [decimals]\n\nDecrease spending allowance for CEP-18 tokens.');
    return;
  }

  try {
    const contractHash = args[0];
    const spender = args[1];
    const amount = args[2];
    const decimals = args[3] ? parseInt(args[3]) : 9;

    if (!validatePublicKey(spender)) {
      await ctx.reply('❌ Invalid spender public key.');
      return;
    }

    const { deployHash, result } = await cep18DecreaseAllowance(contractHash, spender, amount, decimals);
    const response = createDeploySuccessText('CEP-18 Decrease Allowance', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Spender', value: `\`${spender.substring(0, 20)}...\`` },
      { name: 'Amount', value: amount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`CEP-18 decrease allowance successful: ${deployHash}`);
  } catch (error) {
    logger.error('CEP-18 decrease allowance failed:', error);
    await ctx.reply(`❌ Decrease allowance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleTransferFromCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 4) {
    await ctx.reply('❌ Usage: /transfer-from <contract_hash> <owner_public_key> <recipient_public_key> <amount> [decimals]\n\nTransfer CEP-18 tokens on behalf of an approved owner.');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];
    const recipient = args[2];
    const amount = args[3];
    const decimals = args[4] ? parseInt(args[4]) : 9;

    if (!validatePublicKey(owner) || !validatePublicKey(recipient)) {
      await ctx.reply('❌ Invalid public key. Must be 68 hex chars.');
      return;
    }

    const { deployHash, result } = await cep18TransferFrom(contractHash, owner, recipient, amount, decimals);
    const response = createDeploySuccessText('CEP-18 Transfer From', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Owner', value: `\`${owner.substring(0, 20)}...\`` },
      { name: 'Recipient', value: `\`${recipient.substring(0, 20)}...\`` },
      { name: 'Amount', value: amount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`CEP-18 transfer_from successful: ${deployHash}`);
  } catch (error) {
    logger.error('CEP-18 transfer_from failed:', error);
    await ctx.reply(`❌ Transfer from failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
