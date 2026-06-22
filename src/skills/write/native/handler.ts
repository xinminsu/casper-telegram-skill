import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  transferCspr,
  createPurse,
  addAssociatedKey,
  removeAssociatedKey,
  setActionThreshold,
  putNamedKey,
  getSigningPublicKeyHex,
} from '../../../services/casperTransactionService';
import { createDeploySuccessText, checkSigningKey } from '../deployHelper';

function validatePublicKey(key: string): boolean {
  return /^[0-9a-fA-F]{68}$/.test(key);
}

/**
 * Handle /transfer command
 */
export async function handleTransferCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) {
    await ctx.reply(keyError);
    return;
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /transfer <recipient_public_key> <amount> [transfer_id] [source_purse]\n\nTransfer CSPR to another account.');
    return;
  }

  try {
    const recipient = args[0];
    const amount = args[1];
    const transferId = args[2] ? parseInt(args[2]) : undefined;
    const sourcePurse = args[3] || undefined;

    if (!validatePublicKey(recipient)) {
      await ctx.reply('❌ Invalid recipient public key. Must be 68 hex characters starting with 02 or 03.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await ctx.reply('❌ Invalid amount. Must be a positive number.');
      return;
    }

    const { deployHash, result } = await transferCspr(recipient, amount, transferId, sourcePurse);

    const response = createDeploySuccessText(
      'CSPR Transfer',
      deployHash,
      result,
      [
        { name: 'From', value: `\`${getSigningPublicKeyHex().substring(0, 30)}...\`` },
        { name: 'To', value: `\`${recipient.substring(0, 30)}...\`` },
        { name: 'Amount', value: `${amount} CSPR` },
      ]
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Transfer successful: ${deployHash}`);
  } catch (error) {
    logger.error('Transfer failed:', error);
    await ctx.reply(`❌ Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /create-purse command
 */
export async function handleCreatePurseCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) {
    await ctx.reply(keyError);
    return;
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  try {
    const name = args[0] || undefined;

    const { deployHash, result } = await createPurse(name);

    const response = createDeploySuccessText(
      'Create Purse',
      deployHash,
      result,
      name ? [{ name: 'Purse Name', value: name }] : undefined
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Create purse successful: ${deployHash}`);
  } catch (error) {
    logger.error('Create purse failed:', error);
    await ctx.reply(`❌ Create purse failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /add-key command
 */
export async function handleAddKeyCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) {
    await ctx.reply(keyError);
    return;
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /add-key <public_key> <weight>\n\nAdd an associated key to your account (multi-sig setup).');
    return;
  }

  try {
    const publicKey = args[0];
    const weight = parseInt(args[1]);

    if (!validatePublicKey(publicKey)) {
      await ctx.reply('❌ Invalid public key. Must be 68 hex characters starting with 02 or 03.');
      return;
    }

    if (isNaN(weight) || weight < 1 || weight > 255) {
      await ctx.reply('❌ Invalid weight. Must be between 1 and 255.');
      return;
    }

    const { deployHash, result } = await addAssociatedKey(publicKey, weight);

    const response = createDeploySuccessText(
      'Add Associated Key',
      deployHash,
      result,
      [
        { name: 'Added Key', value: `\`${publicKey.substring(0, 30)}...\`` },
        { name: 'Weight', value: weight.toString() },
      ]
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Add key successful: ${deployHash}`);
  } catch (error) {
    logger.error('Add key failed:', error);
    await ctx.reply(`❌ Add key failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /remove-key command
 */
export async function handleRemoveKeyCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) {
    await ctx.reply(keyError);
    return;
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /remove-key <public_key>\n\nRemove an associated key from your account.');
    return;
  }

  try {
    const publicKey = args[0];

    if (!validatePublicKey(publicKey)) {
      await ctx.reply('❌ Invalid public key. Must be 68 hex characters starting with 02 or 03.');
      return;
    }

    const { deployHash, result } = await removeAssociatedKey(publicKey);

    const response = createDeploySuccessText(
      'Remove Associated Key',
      deployHash,
      result,
      [
        { name: 'Removed Key', value: `\`${publicKey.substring(0, 30)}...\`` },
      ]
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Remove key successful: ${deployHash}`);
  } catch (error) {
    logger.error('Remove key failed:', error);
    await ctx.reply(`❌ Remove key failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /set-threshold command
 */
export async function handleSetThresholdCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) {
    await ctx.reply(keyError);
    return;
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /set-threshold <action_type> <threshold>\n\nAction types: deployment, key_management\nSet the action threshold for your account (multi-sig security).');
    return;
  }

  try {
    const actionType = args[0];
    const threshold = parseInt(args[1]);

    if (!['deployment', 'key_management'].includes(actionType)) {
      await ctx.reply('❌ Invalid action type. Must be "deployment" or "key_management".');
      return;
    }

    if (isNaN(threshold) || threshold < 1 || threshold > 255) {
      await ctx.reply('❌ Invalid threshold. Must be between 1 and 255.');
      return;
    }

    const { deployHash, result } = await setActionThreshold(actionType, threshold);

    const response = createDeploySuccessText(
      'Set Action Threshold',
      deployHash,
      result,
      [
        { name: 'Action Type', value: actionType },
        { name: 'New Threshold', value: threshold.toString() },
      ]
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Set threshold successful: ${deployHash}`);
  } catch (error) {
    logger.error('Set threshold failed:', error);
    await ctx.reply(`❌ Set threshold failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /put-named-key command
 */
export async function handlePutNamedKeyCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) {
    await ctx.reply(keyError);
    return;
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /put-named-key <name> <key_value>\n\nBind a named key to your account for quick contract/token references.');
    return;
  }

  try {
    const name = args[0];
    const keyValue = args[1];

    const { deployHash, result } = await putNamedKey(name, keyValue);

    const response = createDeploySuccessText(
      'Put Named Key',
      deployHash,
      result,
      [
        { name: 'Key Name', value: name },
        { name: 'Key Value', value: `\`${keyValue.substring(0, 30)}...\`` },
      ]
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Put named key successful: ${deployHash}`);
  } catch (error) {
    logger.error('Put named key failed:', error);
    await ctx.reply(`❌ Put named key failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
