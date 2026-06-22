import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  getAccountInfo,
  getAccountInfoByHash,
  getBalance,
  getCsprBalance,
  getAccountNamedKeys,
  getPurseBalanceDetails,
  queryGlobalState,
} from '../../../services/casperRpcService';
import {
  createReadText,
  createErrorText,
  truncate,
  motesToCspr,
  validatePublicKey,
  validateAccountHash,
  parseCLValue,
} from '../readHelper';

/**
 * Handle /account-info command
 */
export async function handleAccountInfoCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /account-info <public_key_or_account_hash>\n\nQuery Casper account info (keys, purses, named keys).');
    return;
  }

  try {
    const address = args[0];

    if (!validatePublicKey(address) && !validateAccountHash(address)) {
      await ctx.reply(createErrorText('Invalid Address', 'Please provide a valid public key (68 hex) or account hash (64 hex)'));
      return;
    }

    let accountInfo;
    if (validatePublicKey(address)) {
      accountInfo = await getAccountInfo(address);
    } else {
      accountInfo = await getAccountInfoByHash(address);
    }

    const account = accountInfo?.account;
    if (!account) {
      await ctx.reply(createErrorText('Account Not Found', 'Account does not exist on the network'));
      return;
    }

    // Get main purse balance
    const balanceMotes = await getBalance(account.main_purse);
    const balanceCspr = motesToCspr(balanceMotes);

    // Build associated keys string
    const assocKeys = (account.associated_keys || [])
      .map((k: any) => `${truncate(k.account_hash, 30)} (weight: ${k.weight})`)
      .join('\n') || 'None';

    // Build named keys string
    const namedKeys = (account.named_keys || [])
      .slice(0, 10)
      .map((nk: any) => `${nk.name}: \`${truncate(nk.key, 35)}\``)
      .join('\n') || 'None';

    const response = createReadText('👤 Casper Account Info', [
      { name: 'Account Hash', value: `\`${truncate(account.account_hash, 40)}\`` },
      { name: 'Main Purse', value: `\`${truncate(account.main_purse, 40)}\`` },
      { name: 'Balance', value: `${balanceCspr} CSPR` },
      { name: 'Deployment Threshold', value: account.action_thresholds?.deployment?.toString() || 'N/A' },
      { name: 'Key Management Threshold', value: account.action_thresholds?.key_management?.toString() || 'N/A' },
      { name: 'Associated Keys', value: assocKeys },
      { name: 'Named Keys (Top 10)', value: namedKeys },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Account info query successful');
  } catch (error) {
    logger.error('Account info query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /purse-balance command
 */
export async function handlePurseBalanceCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /purse-balance <purse_uref>\n\nQuery CSPR balance of a specific purse URef.');
    return;
  }

  try {
    const purseUref = args[0];
    const balanceMotes = await getBalance(purseUref);
    const balanceCspr = motesToCspr(balanceMotes);

    const response = createReadText('💰 Purse Balance', [
      { name: 'Purse URef', value: `\`${truncate(purseUref, 45)}\`` },
      { name: 'Balance (CSPR)', value: balanceCspr },
      { name: 'Balance (motes)', value: balanceMotes },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Purse balance query successful');
  } catch (error) {
    logger.error('Purse balance query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /named-keys command
 */
export async function handleNamedKeysCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /named-keys <public_key>\n\nQuery all named keys of an account.');
    return;
  }

  try {
    const publicKey = args[0];

    if (!validatePublicKey(publicKey)) {
      await ctx.reply(createErrorText('Invalid Public Key', 'Public key must be 68 hex characters'));
      return;
    }

    const namedKeys = await getAccountNamedKeys(publicKey);

    if (namedKeys.length === 0) {
      const response = createReadText('🔑 Account Named Keys', [
        { name: 'Public Key', value: `\`${truncate(publicKey, 40)}\`` },
        { name: 'Named Keys', value: 'No named keys found' },
      ]);
      await ctx.reply(response, { parse_mode: 'Markdown' });
      return;
    }

    const namedKeysStr = namedKeys
      .slice(0, 20)
      .map((nk: any, i: number) => `${i + 1}. *${nk.name}*: \`${truncate(nk.key, 40)}\``)
      .join('\n');

    const response = createReadText('🔑 Account Named Keys', [
      { name: 'Public Key', value: `\`${truncate(publicKey, 40)}\`` },
      { name: 'Total Named Keys', value: namedKeys.length.toString() },
      { name: 'Named Keys (Top 20)', value: namedKeysStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Named keys query successful');
  } catch (error) {
    logger.error('Named keys query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /account-balance command
 */
export async function handleAccountBalanceCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /account-balance <address>\n\nQuery CSPR balance for a public key or account hash.');
    return;
  }

  try {
    const address = args[0];

    if (!validatePublicKey(address) && !validateAccountHash(address)) {
      await ctx.reply(createErrorText('Invalid Address', 'Provide a valid public key (68 hex) or account hash (64 hex)'));
      return;
    }

    const balance = await getCsprBalance(address);

    const response = createReadText('💰 Account Balance', [
      { name: 'Address', value: `\`${truncate(address, 45)}\`` },
      { name: 'Balance', value: `${balance} CSPR` },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Account balance query successful');
  } catch (error) {
    logger.error('Account balance query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /purse-details command
 */
export async function handlePurseDetailsCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /purse-details <purse_uref> [state_root_hash]\n\nQuery purse balance with full proof details.');
    return;
  }

  try {
    const purseUref = args[0];
    const stateRootHash = args[1] || undefined;

    const result = await getPurseBalanceDetails(purseUref, stateRootHash);
    const balanceMotes = result.balance_value?.toString() || '0';
    const balanceCspr = motesToCspr(balanceMotes);

    const response = createReadText('💰 Purse Balance Details', [
      { name: 'Purse URef', value: `\`${truncate(purseUref, 45)}\`` },
      { name: 'Balance (CSPR)', value: balanceCspr },
      { name: 'Balance (motes)', value: balanceMotes },
      { name: 'State Root Hash', value: `\`${truncate(result.state_root_hash, 30)}\`` },
      { name: 'Has Proof', value: result.proof ? 'Yes' : 'No' },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Purse details query successful');
  } catch (error) {
    logger.error('Purse details query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /global-state command
 */
export async function handleGlobalStateCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /global-state <key> [path1,path2,...]\n\nQuery global state by key and path.');
    return;
  }

  try {
    const key = args[0];
    const pathStr = args[1] || '';
    const path = pathStr ? pathStr.split(',').map(p => p.trim()).filter(Boolean) : [];

    const result = await queryGlobalState(key, path);
    const storedValue = result.stored_value || {};

    // Determine what type of stored value we got
    let valueStr = 'N/A';
    if (storedValue.Account) {
      valueStr = `Account: hash=${truncate(storedValue.Account.account_hash, 30)}`;
    } else if (storedValue.Contract) {
      valueStr = `Contract: ${truncate(storedValue.Contract.contract_hash, 30)}`;
    } else if (storedValue.CLValue) {
      valueStr = parseCLValue(storedValue.CLValue);
    } else {
      valueStr = JSON.stringify(storedValue).substring(0, 200);
    }

    const response = createReadText('🔍 Global State Query', [
      { name: 'Key', value: `\`${truncate(key, 45)}\`` },
      { name: 'Path', value: path.length > 0 ? path.join(' → ') : '(root)' },
      { name: 'Block Hash', value: `\`${truncate(result.block_hash, 30)}\`` },
      { name: 'Stored Value', value: truncate(valueStr, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Global state query successful');
  } catch (error) {
    logger.error('Global state query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}
