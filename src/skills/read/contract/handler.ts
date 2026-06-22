import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  getContractInfo,
  getContractEntryPoints,
  getDictionaryItem,
  getDictionaryItemByAccount,
  getDictionaryItemByContract,
  getStateItem,
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
 * Handle /contract-info command
 */
export async function handleContractInfoCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /contract-info <contract_hash>\n\nQuery Casper contract metadata (hash, version, entry points).');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Contract Hash', 'Contract hash must be 64 hex chars (with or without hash- prefix)'));
      return;
    }

    const result = await getContractInfo(contractHash);
    const contract = result?.contract;

    if (!contract) {
      await ctx.reply(createErrorText('Contract Not Found', 'Contract does not exist on the network'));
      return;
    }

    const entryPoints = contract.entry_points || [];
    const entryPointList = entryPoints
      .slice(0, 15)
      .map((ep: any, i: number) => `${i + 1}. *${ep.name}* (${ep.entry_point_type || 'contract'})`)
      .join('\n') || 'None';

    const namedKeys = (contract.named_keys || [])
      .slice(0, 10)
      .map((nk: any) => `${nk.name}: \`${truncate(nk.key, 35)}\``)
      .join('\n') || 'None';

    const response = createReadText('📋 Contract Information', [
      { name: 'Contract Hash', value: `\`${truncate(contract.contract_hash, 40)}\`` },
      { name: 'Contract Package Hash', value: `\`${truncate(contract.contract_package_hash, 40)}\`` },
      { name: 'Version', value: contract.contract_version?.toString() || 'N/A' },
      { name: 'Protocol Version', value: contract.protocol_version?.toString() || 'N/A' },
      { name: 'Entry Points Count', value: entryPoints.length.toString() },
      { name: 'Entry Points (Top 15)', value: entryPointList },
      { name: 'Named Keys (Top 10)', value: namedKeys },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Contract info query successful');
  } catch (error) {
    logger.error('Contract info query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /entry-points command
 */
export async function handleEntryPointsCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /entry-points <contract_hash>\n\nQuery all callable entry points of a contract.');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Contract Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    const entryPoints = await getContractEntryPoints(contractHash);

    if (!entryPoints || entryPoints.length === 0) {
      await ctx.reply(createErrorText('No Entry Points', 'Contract has no entry points or does not exist'));
      return;
    }

    const entryPointList = entryPoints
      .map((ep: any, i: number) => {
        const epArgs = (ep.args || [])
          .map((a: any) => `${a.name}:${a.cl_type}`)
          .join(', ');
        return `${i + 1}. *${ep.name}* (${ep.entry_point_type || 'contract'})\n   Args: ${epArgs || 'none'}`;
      })
      .join('\n\n');

    const response = createReadText('🔧 Contract Entry Points', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Total Entry Points', value: entryPoints.length.toString() },
      { name: 'Entry Points', value: truncate(entryPointList, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Entry points query successful');
  } catch (error) {
    logger.error('Entry points query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /dict-item command
 */
export async function handleDictItemCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /dict-item <uref> <dict_key>\n\nQuery a dictionary item by seed URef and dictionary key.');
    return;
  }

  try {
    const uref = args[0];
    const dictKey = args[1];

    const result = await getDictionaryItem(uref, dictKey);
    const storedValue = result?.stored_value || {};
    const clValue = storedValue.CLValue || storedValue.cl_value;

    const response = createReadText('📖 Dictionary Item', [
      { name: 'Seed URef', value: `\`${truncate(uref, 45)}\`` },
      { name: 'Dictionary Key', value: dictKey },
      { name: 'Block Hash', value: `\`${truncate(result.block_hash, 30)}\`` },
      { name: 'Value', value: truncate(parseCLValue(clValue), 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Dictionary item query successful');
  } catch (error) {
    logger.error('Dictionary item query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /dict-by-account command
 */
export async function handleDictByAccountCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /dict-by-account <public_key> <named_key> <dict_key>\n\nQuery dictionary item via account named key.');
    return;
  }

  try {
    const publicKey = args[0];
    const namedKey = args[1];
    const dictKey = args[2];

    if (!validatePublicKey(publicKey)) {
      await ctx.reply(createErrorText('Invalid Public Key', 'Public key must be 68 hex characters'));
      return;
    }

    const result = await getDictionaryItemByAccount(publicKey, namedKey, dictKey);
    const storedValue = result?.stored_value || {};
    const clValue = storedValue.CLValue || storedValue.cl_value;

    const response = createReadText('📖 Dictionary Item (via Account)', [
      { name: 'Account Public Key', value: `\`${truncate(publicKey, 40)}\`` },
      { name: 'Named Key', value: namedKey },
      { name: 'Dictionary Key', value: dictKey },
      { name: 'Value', value: truncate(parseCLValue(clValue), 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Dictionary by account query successful');
  } catch (error) {
    logger.error('Dictionary by account query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /dict-by-contract command
 */
export async function handleDictByContractCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /dict-by-contract <contract_hash> <named_key> <dict_key>\n\nQuery dictionary item via contract named key.');
    return;
  }

  try {
    const contractHash = args[0];
    const namedKey = args[1];
    const dictKey = args[2];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Contract Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    const result = await getDictionaryItemByContract(contractHash, namedKey, dictKey);
    const storedValue = result?.stored_value || {};
    const clValue = storedValue.CLValue || storedValue.cl_value;

    const response = createReadText('📖 Dictionary Item (via Contract)', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Named Key', value: namedKey },
      { name: 'Dictionary Key', value: dictKey },
      { name: 'Value', value: truncate(parseCLValue(clValue), 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Dictionary by contract query successful');
  } catch (error) {
    logger.error('Dictionary by contract query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /state-item command
 */
export async function handleStateItemCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /state-item <key> [path1,path2,...]\n\nQuery a stored state item by key and path.');
    return;
  }

  try {
    const key = args[0];
    const pathStr = args[1] || '';
    const path = pathStr ? pathStr.split(',').map(p => p.trim()).filter(Boolean) : [];

    const result = await getStateItem(key, undefined, path);
    const storedValue = result?.stored_value || {};

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

    const response = createReadText('📦 State Item Query', [
      { name: 'Key', value: `\`${truncate(key, 45)}\`` },
      { name: 'Path', value: path.length > 0 ? path.join(' → ') : '(root)' },
      { name: 'Block Hash', value: `\`${truncate(result.block_hash, 30)}\`` },
      { name: 'Stored Value', value: truncate(valueStr, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('State item query successful');
  } catch (error) {
    logger.error('State item query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /contract-named-keys command
 */
export async function handleContractNamedKeysCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /contract-named-keys <contract_hash>\n\nQuery all named keys of a contract.');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Contract Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    const result = await getContractInfo(contractHash);
    const namedKeys = result?.contract?.named_keys || [];

    if (namedKeys.length === 0) {
      const response = createReadText('🔑 Contract Named Keys', [
        { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
        { name: 'Named Keys', value: 'No named keys found' },
      ]);
      await ctx.reply(response, { parse_mode: 'Markdown' });
      return;
    }

    const namedKeysStr = namedKeys
      .slice(0, 20)
      .map((nk: any, i: number) => `${i + 1}. *${nk.name}*: \`${truncate(nk.key, 40)}\``)
      .join('\n');

    const response = createReadText('🔑 Contract Named Keys', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Total Named Keys', value: namedKeys.length.toString() },
      { name: 'Named Keys (Top 20)', value: namedKeysStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Contract named keys query successful');
  } catch (error) {
    logger.error('Contract named keys query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}
