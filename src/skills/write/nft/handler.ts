import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  cep47Mint, cep47MintCopies, cep47Burn, cep47Transfer,
  cep47Approve, cep47TransferFrom, cep78SetTokenMetadata,
  cep78BatchTransfer, cep78BatchBurn, cep78SetAdmin,
} from '../../../services/casperTransactionService';
import { createDeploySuccessText, checkSigningKey } from '../deployHelper';

function validatePublicKey(key: string): boolean {
  return /^[0-9a-fA-F]{68}$/.test(key);
}

export async function handleNftMintCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /nft-mint <contract_hash> <recipient_public_key> <token_id> [metadata_key] [metadata_value]\n\nMint a single NFT (CEP-47 standard).');
    return;
  }

  try {
    const contractHash = args[0];
    const recipient = args[1];
    const tokenId = args[2];
    const metadataKey = args[3];
    const metadataValue = args[4];

    if (!validatePublicKey(recipient)) {
      await ctx.reply('❌ Invalid recipient public key.');
      return;
    }

    const metadata = (metadataKey && metadataValue) ? { [metadataKey]: metadataValue } : undefined;

    const { deployHash, result } = await cep47Mint(contractHash, recipient, tokenId, metadata);
    const response = createDeploySuccessText('NFT Mint (CEP-47)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Recipient', value: `\`${recipient.substring(0, 20)}...\`` },
      { name: 'Token ID', value: tokenId },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT mint successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT mint failed:', error);
    await ctx.reply(`❌ NFT mint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftMintCopiesCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /nft-mint-copies <contract_hash> <recipient_public_key> <count>\n\nMint multiple NFT copies (CEP-47 batch mint).');
    return;
  }

  try {
    const contractHash = args[0];
    const recipient = args[1];
    const count = parseInt(args[2]);

    if (!validatePublicKey(recipient)) {
      await ctx.reply('❌ Invalid recipient public key.');
      return;
    }
    if (isNaN(count) || count < 1 || count > 100) {
      await ctx.reply('❌ Count must be between 1 and 100.');
      return;
    }

    const { deployHash, result } = await cep47MintCopies(contractHash, recipient, count);
    const response = createDeploySuccessText('NFT Batch Mint (CEP-47)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Recipient', value: `\`${recipient.substring(0, 20)}...\`` },
      { name: 'Count', value: count.toString() },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT mint copies successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT mint copies failed:', error);
    await ctx.reply(`❌ NFT mint copies failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftBurnCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /nft-burn <contract_hash> <owner_public_key> <token_id>\n\nBurn an NFT (CEP-47 standard).');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];
    const tokenId = args[2];

    if (!validatePublicKey(owner)) {
      await ctx.reply('❌ Invalid owner public key.');
      return;
    }

    const { deployHash, result } = await cep47Burn(contractHash, owner, tokenId);
    const response = createDeploySuccessText('NFT Burn (CEP-47)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Owner', value: `\`${owner.substring(0, 20)}...\`` },
      { name: 'Token ID', value: tokenId },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT burn successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT burn failed:', error);
    await ctx.reply(`❌ NFT burn failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftTransferCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /nft-transfer <contract_hash> <recipient_public_key> <token_id>\n\nTransfer an NFT to another account (CEP-47).');
    return;
  }

  try {
    const contractHash = args[0];
    const recipient = args[1];
    const tokenId = args[2];

    if (!validatePublicKey(recipient)) {
      await ctx.reply('❌ Invalid recipient public key.');
      return;
    }

    const { deployHash, result } = await cep47Transfer(contractHash, recipient, tokenId);
    const response = createDeploySuccessText('NFT Transfer (CEP-47)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Recipient', value: `\`${recipient.substring(0, 20)}...\`` },
      { name: 'Token ID', value: tokenId },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT transfer successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT transfer failed:', error);
    await ctx.reply(`❌ NFT transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftApproveCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /nft-approve <contract_hash> <spender_public_key> <token_id>\n\nApprove a spender for an NFT (CEP-47).');
    return;
  }

  try {
    const contractHash = args[0];
    const spender = args[1];
    const tokenId = args[2];

    if (!validatePublicKey(spender)) {
      await ctx.reply('❌ Invalid spender public key.');
      return;
    }

    const { deployHash, result } = await cep47Approve(contractHash, spender, tokenId);
    const response = createDeploySuccessText('NFT Approve (CEP-47)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Spender', value: `\`${spender.substring(0, 20)}...\`` },
      { name: 'Token ID', value: tokenId },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT approve successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT approve failed:', error);
    await ctx.reply(`❌ NFT approve failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftTransferFromCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 4) {
    await ctx.reply('❌ Usage: /nft-transfer-from <contract_hash> <owner_public_key> <recipient_public_key> <token_id>\n\nTransfer NFT from approved owner (CEP-47).');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];
    const recipient = args[2];
    const tokenId = args[3];

    if (!validatePublicKey(owner) || !validatePublicKey(recipient)) {
      await ctx.reply('❌ Invalid public key.');
      return;
    }

    const { deployHash, result } = await cep47TransferFrom(contractHash, owner, recipient, tokenId);
    const response = createDeploySuccessText('NFT Transfer From (CEP-47)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Owner', value: `\`${owner.substring(0, 20)}...\`` },
      { name: 'Recipient', value: `\`${recipient.substring(0, 20)}...\`` },
      { name: 'Token ID', value: tokenId },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT transfer_from successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT transfer_from failed:', error);
    await ctx.reply(`❌ NFT transfer_from failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftSetMetadataCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 4) {
    await ctx.reply('❌ Usage: /nft-set-metadata <contract_hash> <token_id> <metadata_key> <metadata_value>\n\nUpdate NFT metadata (CEP-78 advanced).');
    return;
  }

  try {
    const contractHash = args[0];
    const tokenId = args[1];
    const metadataKey = args[2];
    const metadataValue = args[3];

    const { deployHash, result } = await cep78SetTokenMetadata(contractHash, tokenId, { [metadataKey]: metadataValue });
    const response = createDeploySuccessText('NFT Set Metadata (CEP-78)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Token ID', value: tokenId },
      { name: metadataKey, value: metadataValue },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT set metadata successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT set metadata failed:', error);
    await ctx.reply(`❌ Set metadata failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftBatchTransferCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /nft-batch-transfer <contract_hash> <recipient_public_key> <token_ids>\n\nBatch transfer multiple NFTs (CEP-78). Token IDs comma-separated.');
    return;
  }

  try {
    const contractHash = args[0];
    const recipient = args[1];
    const tokenIdsStr = args[2];
    const tokenIds = tokenIdsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

    if (!validatePublicKey(recipient)) {
      await ctx.reply('❌ Invalid recipient public key.');
      return;
    }

    const { deployHash, result } = await cep78BatchTransfer(contractHash, recipient, tokenIds);
    const response = createDeploySuccessText('NFT Batch Transfer (CEP-78)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Recipient', value: `\`${recipient.substring(0, 20)}...\`` },
      { name: 'Token Count', value: tokenIds.length.toString() },
      { name: 'Token IDs', value: tokenIdsStr },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT batch transfer successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT batch transfer failed:', error);
    await ctx.reply(`❌ Batch transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftBatchBurnCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /nft-batch-burn <contract_hash> <owner_public_key> <token_ids>\n\nBatch burn multiple NFTs (CEP-78). Token IDs comma-separated.');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];
    const tokenIdsStr = args[2];
    const tokenIds = tokenIdsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

    if (!validatePublicKey(owner)) {
      await ctx.reply('❌ Invalid owner public key.');
      return;
    }

    const { deployHash, result } = await cep78BatchBurn(contractHash, owner, tokenIds);
    const response = createDeploySuccessText('NFT Batch Burn (CEP-78)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'Owner', value: `\`${owner.substring(0, 20)}...\`` },
      { name: 'Token Count', value: tokenIds.length.toString() },
      { name: 'Token IDs', value: tokenIdsStr },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT batch burn successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT batch burn failed:', error);
    await ctx.reply(`❌ Batch burn failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleNftSetAdminCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /nft-set-admin <contract_hash> <admin_public_key>\n\nSet NFT contract admin (CEP-78).');
    return;
  }

  try {
    const contractHash = args[0];
    const admin = args[1];

    if (!validatePublicKey(admin)) {
      await ctx.reply('❌ Invalid admin public key.');
      return;
    }

    const { deployHash, result } = await cep78SetAdmin(contractHash, admin);
    const response = createDeploySuccessText('NFT Set Admin (CEP-78)', deployHash, result, [
      { name: 'Contract', value: `\`${contractHash.substring(0, 20)}...\`` },
      { name: 'New Admin', value: `\`${admin.substring(0, 20)}...\`` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`NFT set admin successful: ${deployHash}`);
  } catch (error) {
    logger.error('NFT set admin failed:', error);
    await ctx.reply(`❌ Set admin failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
