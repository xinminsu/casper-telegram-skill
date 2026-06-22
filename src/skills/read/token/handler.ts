import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  getContractInfo,
  getDictionaryItem,
  queryGlobalState,
  getAccountInfo,
} from '../../../services/casperRpcService';
import {
  createReadText,
  createErrorText,
  truncate,
  validateContractHash,
  validatePublicKey,
  parseCLValue,
} from '../readHelper';

/**
 * Helper: Get a contract's named key URef
 */
async function getContractNamedKeyURef(
  contractHash: string,
  namedKey: string
): Promise<string | null> {
  const contractInfo = await getContractInfo(contractHash);
  const namedKeys = contractInfo?.contract?.named_keys || [];
  const found = namedKeys.find((nk: any) => nk.name === namedKey);
  return found ? found.key : null;
}

/**
 * Handle /token-total-supply command
 */
export async function handleTokenTotalSupplyCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /token-total-supply <contract_hash>\n\nQuery CEP-18 token total supply.');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let totalSupplyURef: string | null = null;
    const possibleNames = ['total_supply', 'total_supply_uref', 'totalsupply'];

    for (const name of possibleNames) {
      totalSupplyURef = await getContractNamedKeyURef(contractHash, name);
      if (totalSupplyURef) break;
    }

    if (!totalSupplyURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find total_supply URef in contract named keys. The contract may use a different storage pattern.'));
      return;
    }

    const result = await queryGlobalState(totalSupplyURef);
    const clValue = result?.stored_value?.CLValue;
    const valueStr = parseCLValue(clValue);

    const response = createReadText('🪙 CEP-18 Total Supply', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Total Supply URef', value: `\`${truncate(totalSupplyURef, 40)}\`` },
      { name: 'Total Supply', value: valueStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Token total supply query successful');
  } catch (error) {
    logger.error('Token total supply query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /token-balance command
 */
export async function handleTokenBalanceCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /token-balance <contract_hash> <owner_public_key>\n\nQuery CEP-18 token balance of an account.');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }
    if (!validatePublicKey(owner)) {
      await ctx.reply(createErrorText('Invalid Public Key', 'Owner must be 68 hex chars'));
      return;
    }

    let balancesURef: string | null = null;
    const possibleNames = ['balances', 'balances_uref', 'balance'];

    for (const name of possibleNames) {
      balancesURef = await getContractNamedKeyURef(contractHash, name);
      if (balancesURef) break;
    }

    if (!balancesURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find balances URef in contract named keys'));
      return;
    }

    const accountInfo = await getAccountInfo(owner);
    const fullAccountHash = accountInfo?.account?.account_hash || '';
    const dictKey = fullAccountHash.replace(/^account-hash-/, '');

    const result = await getDictionaryItem(balancesURef, dictKey);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const valueStr = parseCLValue(clValue);

    const response = createReadText('🪙 CEP-18 Token Balance', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Owner', value: `\`${truncate(owner, 40)}\`` },
      { name: 'Balance', value: valueStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Token balance query successful');
  } catch (error) {
    logger.error('Token balance query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /token-allowance command
 */
export async function handleTokenAllowanceCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /token-allowance <contract_hash> <owner> <spender>\n\nQuery CEP-18 allowance (approved spender amount).');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];
    const spender = args[2];

    if (!validateContractHash(contractHash) || !validatePublicKey(owner) || !validatePublicKey(spender)) {
      await ctx.reply(createErrorText('Invalid Input', 'Check contract hash and public key formats'));
      return;
    }

    let allowancesURef: string | null = null;
    const possibleNames = ['allowances', 'allowances_uref', 'allowance'];

    for (const name of possibleNames) {
      allowancesURef = await getContractNamedKeyURef(contractHash, name);
      if (allowancesURef) break;
    }

    if (!allowancesURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find allowances URef in contract named keys'));
      return;
    }

    const ownerAccountInfo = await getAccountInfo(owner);
    const spenderAccountInfo = await getAccountInfo(spender);
    const ownerHash = (ownerAccountInfo?.account?.account_hash || '').replace(/^account-hash-/, '');
    const spenderHash = (spenderAccountInfo?.account?.account_hash || '').replace(/^account-hash-/, '');
    const dictKey = ownerHash + spenderHash;

    const result = await getDictionaryItem(allowancesURef, dictKey);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const valueStr = parseCLValue(clValue);

    const response = createReadText('🪙 CEP-18 Allowance', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Owner', value: `\`${truncate(owner, 40)}\`` },
      { name: 'Spender', value: `\`${truncate(spender, 40)}\`` },
      { name: 'Allowance', value: valueStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Token allowance query successful');
  } catch (error) {
    logger.error('Token allowance query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /token-meta command
 */
export async function handleTokenMetaCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /token-meta <contract_hash>\n\nQuery CEP-18 token name, symbol, and decimals.');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    const contractInfo = await getContractInfo(contractHash);
    const namedKeys = contractInfo?.contract?.named_keys || [];

    const nameKey = namedKeys.find((nk: any) => ['name', 'token_name'].includes(nk.name));
    const symbolKey = namedKeys.find((nk: any) => ['symbol', 'token_symbol'].includes(nk.name));
    const decimalsKey = namedKeys.find((nk: any) => ['decimals', 'token_decimals'].includes(nk.name));

    let nameValue = 'N/A';
    let symbolValue = 'N/A';
    let decimalsValue = 'N/A';

    if (nameKey) {
      try {
        const result = await queryGlobalState(nameKey.key);
        nameValue = parseCLValue(result?.stored_value?.CLValue);
      } catch { /* keep N/A */ }
    }

    if (symbolKey) {
      try {
        const result = await queryGlobalState(symbolKey.key);
        symbolValue = parseCLValue(result?.stored_value?.CLValue);
      } catch { /* keep N/A */ }
    }

    if (decimalsKey) {
      try {
        const result = await queryGlobalState(decimalsKey.key);
        decimalsValue = parseCLValue(result?.stored_value?.CLValue);
      } catch { /* keep N/A */ }
    }

    const response = createReadText('🪙 CEP-18 Token Metadata', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Name', value: nameValue },
      { name: 'Symbol', value: symbolValue },
      { name: 'Decimals', value: decimalsValue },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Token metadata query successful');
  } catch (error) {
    logger.error('Token metadata query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

// ==================== NFT Handlers ====================

/**
 * Handle /nft-total-supply command
 */
export async function handleNftTotalSupplyCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /nft-total-supply <contract_hash>\n\nQuery NFT contract total supply.');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let supplyURef: string | null = null;
    const possibleNames = ['total_supply', 'minted_tokens', 'number_of_minted_tokens', 'count'];

    for (const name of possibleNames) {
      supplyURef = await getContractNamedKeyURef(contractHash, name);
      if (supplyURef) break;
    }

    if (!supplyURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find total supply URef in contract named keys'));
      return;
    }

    const result = await queryGlobalState(supplyURef);
    const valueStr = parseCLValue(result?.stored_value?.CLValue);

    const response = createReadText('🖼️ NFT Total Supply', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Total Supply', value: valueStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('NFT total supply query successful');
  } catch (error) {
    logger.error('NFT total supply query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /nft-owner-of command
 */
export async function handleNftOwnerOfCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /nft-owner-of <contract_hash> <token_id>\n\nQuery the owner of a specific NFT.');
    return;
  }

  try {
    const contractHash = args[0];
    const tokenId = args[1];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let ownersURef: string | null = null;
    const possibleNames = ['owners', 'token_owners', 'account_by_id', 'metadata_owners'];

    for (const name of possibleNames) {
      ownersURef = await getContractNamedKeyURef(contractHash, name);
      if (ownersURef) break;
    }

    if (!ownersURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find owners URef in contract named keys'));
      return;
    }

    const result = await getDictionaryItem(ownersURef, tokenId);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const ownerStr = parseCLValue(clValue);

    const response = createReadText('🖼️ NFT Owner', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Token ID', value: tokenId },
      { name: 'Owner', value: ownerStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('NFT owner query successful');
  } catch (error) {
    logger.error('NFT owner query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /nft-tokens-of command
 */
export async function handleNftTokensOfCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /nft-tokens-of <contract_hash> <owner_public_key>\n\nQuery all NFT token IDs owned by an account.');
    return;
  }

  try {
    const contractHash = args[0];
    const owner = args[1];

    if (!validateContractHash(contractHash) || !validatePublicKey(owner)) {
      await ctx.reply(createErrorText('Invalid Input', 'Check contract hash and public key formats'));
      return;
    }

    const accountInfo = await getAccountInfo(owner);
    const accountHash = (accountInfo?.account?.account_hash || '').replace(/^account-hash-/, '');

    let ownedTokensURef: string | null = null;
    const possibleNames = ['owned_tokens', 'account_owned_tokens', 'token_owners_reverse'];

    for (const name of possibleNames) {
      ownedTokensURef = await getContractNamedKeyURef(contractHash, name);
      if (ownedTokensURef) break;
    }

    if (!ownedTokensURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find owned_tokens URef in contract named keys'));
      return;
    }

    const result = await getDictionaryItem(ownedTokensURef, accountHash);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const tokensStr = parseCLValue(clValue);

    const response = createReadText('🖼️ NFT Tokens Owned', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Owner', value: `\`${truncate(owner, 40)}\`` },
      { name: 'Owned Tokens', value: truncate(tokensStr, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('NFT tokens-of query successful');
  } catch (error) {
    logger.error('NFT tokens-of query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /nft-metadata command
 */
export async function handleNftMetadataCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /nft-metadata <contract_hash> <token_id>\n\nQuery NFT metadata (image, attributes, etc.).');
    return;
  }

  try {
    const contractHash = args[0];
    const tokenId = args[1];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let metadataURef: string | null = null;
    const possibleNames = ['metadata', 'token_metadata', 'metadata_by_id', 'cep78_metadata'];

    for (const name of possibleNames) {
      metadataURef = await getContractNamedKeyURef(contractHash, name);
      if (metadataURef) break;
    }

    if (!metadataURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find metadata URef in contract named keys'));
      return;
    }

    const result = await getDictionaryItem(metadataURef, tokenId);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const metadataStr = parseCLValue(clValue);

    const response = createReadText('🖼️ NFT Metadata', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Token ID', value: tokenId },
      { name: 'Metadata', value: truncate(metadataStr, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('NFT metadata query successful');
  } catch (error) {
    logger.error('NFT metadata query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /nft-approved command
 */
export async function handleNftApprovedCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /nft-approved <contract_hash> <token_id>\n\nQuery approved spender for an NFT.');
    return;
  }

  try {
    const contractHash = args[0];
    const tokenId = args[1];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let approvalsURef: string | null = null;
    const possibleNames = ['approvals', 'token_approvals', 'approved'];

    for (const name of possibleNames) {
      approvalsURef = await getContractNamedKeyURef(contractHash, name);
      if (approvalsURef) break;
    }

    if (!approvalsURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find approvals URef in contract named keys'));
      return;
    }

    const result = await getDictionaryItem(approvalsURef, tokenId);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const approvedStr = parseCLValue(clValue);

    const response = createReadText('🖼️ NFT Approved Spender', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Token ID', value: tokenId },
      { name: 'Approved', value: truncate(approvedStr, 100) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('NFT approved query successful');
  } catch (error) {
    logger.error('NFT approved query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /nft-max-supply command (CEP-78)
 */
export async function handleNftMaxSupplyCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /nft-max-supply <contract_hash>\n\nQuery NFT contract max supply limit (CEP-78).');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let maxSupplyURef: string | null = null;
    const possibleNames = ['max_supply', 'collection_max_supply', 'max_total_supply'];

    for (const name of possibleNames) {
      maxSupplyURef = await getContractNamedKeyURef(contractHash, name);
      if (maxSupplyURef) break;
    }

    if (!maxSupplyURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find max_supply URef in contract named keys'));
      return;
    }

    const result = await queryGlobalState(maxSupplyURef);
    const valueStr = parseCLValue(result?.stored_value?.CLValue);

    const response = createReadText('🖼️ NFT Max Supply (CEP-78)', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Max Supply', value: valueStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('NFT max supply query successful');
  } catch (error) {
    logger.error('NFT max supply query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /nft-batch-owners command (CEP-78)
 */
export async function handleNftBatchOwnersCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /nft-batch-owners <contract_hash> <token_ids>\n\nQuery owners of multiple NFTs at once (CEP-78). Token IDs comma-separated.');
    return;
  }

  try {
    const contractHash = args[0];
    const tokenIdsStr = args[1];
    const tokenIds = tokenIdsStr.split(',').map(s => s.trim()).filter(Boolean);

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    if (tokenIds.length === 0) {
      await ctx.reply(createErrorText('No Token IDs', 'Please provide comma-separated token IDs'));
      return;
    }

    let ownersURef: string | null = null;
    const possibleNames = ['owners', 'token_owners', 'account_by_id'];

    for (const name of possibleNames) {
      ownersURef = await getContractNamedKeyURef(contractHash, name);
      if (ownersURef) break;
    }

    if (!ownersURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find owners URef in contract named keys'));
      return;
    }

    const limitedIds = tokenIds.slice(0, 10);
    const results: { tokenId: string; owner: string }[] = [];

    for (const tokenId of limitedIds) {
      try {
        const result = await getDictionaryItem(ownersURef, tokenId);
        const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
        results.push({ tokenId, owner: parseCLValue(clValue) });
      } catch {
        results.push({ tokenId, owner: 'Error/Not Found' });
      }
    }

    const resultsStr = results
      .map(r => `Token #${r.tokenId}: ${truncate(r.owner, 50)}`)
      .join('\n');

    const response = createReadText('🖼️ NFT Batch Owners (CEP-78)', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Queried', value: `${limitedIds.length} of ${tokenIds.length} tokens` },
      { name: 'Results', value: resultsStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('NFT batch owners query successful');
  } catch (error) {
    logger.error('NFT batch owners query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}
