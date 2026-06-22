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
 * Helper: Get a named key URef from a contract
 */
async function getNamedKeyURef(contractHash: string, namedKey: string): Promise<string | null> {
  const contractInfo = await getContractInfo(contractHash);
  const namedKeys = contractInfo?.contract?.named_keys || [];
  const found = namedKeys.find((nk: any) => nk.name === namedKey);
  return found ? found.key : null;
}

/**
 * Helper: Try multiple possible named key names
 */
async function tryNamedKeys(contractHash: string, possibleNames: string[]): Promise<string | null> {
  for (const name of possibleNames) {
    const uref = await getNamedKeyURef(contractHash, name);
    if (uref) return uref;
  }
  return null;
}

// ==================== Counter Handlers ====================

/**
 * Handle /counter-value command
 */
export async function handleCounterValueCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /counter-value <contract_hash>\n\nQuery the current value of a counter contract.');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let countURef: string | null = null;
    const possibleNames = ['count', 'counter', 'value', 'counter_value'];

    for (const name of possibleNames) {
      countURef = await getNamedKeyURef(contractHash, name);
      if (countURef) break;
    }

    if (!countURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find count URef in contract named keys'));
      return;
    }

    const result = await queryGlobalState(countURef);
    const valueStr = parseCLValue(result?.stored_value?.CLValue);

    const response = createReadText('🔢 Counter Value', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Count URef', value: `\`${truncate(countURef, 40)}\`` },
      { name: 'Current Value', value: valueStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Counter value query successful');
  } catch (error) {
    logger.error('Counter value query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

// ==================== AMM Handlers ====================

/**
 * Handle /amm-reserves command
 */
export async function handleAmmReservesCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /amm-reserves <contract_hash>\n\nQuery AMM pool reserves (token balances and LP supply).');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    const reserveAURef = await tryNamedKeys(contractHash, ['reserve_a', 'token_a_reserve', 'reserve0', 'reserve_0']);
    const reserveBURef = await tryNamedKeys(contractHash, ['reserve_b', 'token_b_reserve', 'reserve1', 'reserve_1']);
    const lpSupplyURef = await tryNamedKeys(contractHash, ['lp_token_supply', 'total_lp', 'total_supply']);

    if (!reserveAURef && !reserveBURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find reserve URefs in contract named keys'));
      return;
    }

    let reserveA = 'N/A';
    let reserveB = 'N/A';
    let lpSupply = 'N/A';

    if (reserveAURef) {
      const result = await queryGlobalState(reserveAURef);
      reserveA = parseCLValue(result?.stored_value?.CLValue);
    }

    if (reserveBURef) {
      const result = await queryGlobalState(reserveBURef);
      reserveB = parseCLValue(result?.stored_value?.CLValue);
    }

    if (lpSupplyURef) {
      const result = await queryGlobalState(lpSupplyURef);
      lpSupply = parseCLValue(result?.stored_value?.CLValue);
    }

    const response = createReadText('📈 AMM Pool Reserves', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Reserve A', value: reserveA },
      { name: 'Reserve B', value: reserveB },
      { name: 'LP Total Supply', value: lpSupply },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('AMM reserves query successful');
  } catch (error) {
    logger.error('AMM reserves query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /amm-lp-balance command
 */
export async function handleAmmLpBalanceCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /amm-lp-balance <contract_hash> <user_public_key>\n\nQuery user LP token balance in an AMM pool.');
    return;
  }

  try {
    const contractHash = args[0];
    const user = args[1];

    if (!validateContractHash(contractHash) || !validatePublicKey(user)) {
      await ctx.reply(createErrorText('Invalid Input', 'Check contract hash and public key formats'));
      return;
    }

    let balancesURef: string | null = null;
    const possibleNames = ['lp_balances', 'balances', 'lp_token_balances'];

    for (const name of possibleNames) {
      balancesURef = await getNamedKeyURef(contractHash, name);
      if (balancesURef) break;
    }

    if (!balancesURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find LP balances URef in contract named keys'));
      return;
    }

    const accountInfo = await getAccountInfo(user);
    const accountHash = (accountInfo?.account?.account_hash || '').replace(/^account-hash-/, '');

    const result = await getDictionaryItem(balancesURef, accountHash);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const balanceStr = parseCLValue(clValue);

    const response = createReadText('📈 LP Token Balance', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'User', value: `\`${truncate(user, 40)}\`` },
      { name: 'LP Balance', value: balanceStr },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('AMM LP balance query successful');
  } catch (error) {
    logger.error('AMM LP balance query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /amm-stake-info command
 */
export async function handleAmmStakeInfoCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /amm-stake-info <contract_hash> <user_public_key>\n\nQuery user LP staking info (staked amount, pending rewards).');
    return;
  }

  try {
    const contractHash = args[0];
    const user = args[1];

    if (!validateContractHash(contractHash) || !validatePublicKey(user)) {
      await ctx.reply(createErrorText('Invalid Input', 'Check contract hash and public key formats'));
      return;
    }

    let stakeInfoURef: string | null = null;
    const possibleNames = ['stake_info', 'staking_info', 'user_stakes', 'stakes'];

    for (const name of possibleNames) {
      stakeInfoURef = await getNamedKeyURef(contractHash, name);
      if (stakeInfoURef) break;
    }

    if (!stakeInfoURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find stake info URef in contract named keys'));
      return;
    }

    const accountInfo = await getAccountInfo(user);
    const accountHash = (accountInfo?.account?.account_hash || '').replace(/^account-hash-/, '');

    const result = await getDictionaryItem(stakeInfoURef, accountHash);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const stakeStr = parseCLValue(clValue);

    const response = createReadText('📈 Staking Info', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'User', value: `\`${truncate(user, 40)}\`` },
      { name: 'Stake Info', value: truncate(stakeStr, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('AMM stake info query successful');
  } catch (error) {
    logger.error('AMM stake info query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

// ==================== Governance Handlers ====================

/**
 * Handle /all-proposals command
 */
export async function handleAllProposalsCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /all-proposals <contract_hash>\n\nQuery all governance proposals.');
    return;
  }

  try {
    const contractHash = args[0];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let proposalsURef: string | null = null;
    const possibleNames = ['proposals', 'all_proposals', 'proposal_list'];

    for (const name of possibleNames) {
      proposalsURef = await getNamedKeyURef(contractHash, name);
      if (proposalsURef) break;
    }

    let countURef: string | null = null;
    const countNames = ['proposal_count', 'total_proposals', 'next_proposal_id'];
    for (const name of countNames) {
      countURef = await getNamedKeyURef(contractHash, name);
      if (countURef) break;
    }

    let proposalCount = 'N/A';
    if (countURef) {
      const result = await queryGlobalState(countURef);
      proposalCount = parseCLValue(result?.stored_value?.CLValue);
    }

    const response = createReadText('🗳️ Governance Proposals', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Proposal Count', value: proposalCount },
      { name: 'Proposals URef', value: proposalsURef ? `\`${truncate(proposalsURef, 40)}\`` : 'Not found' },
      { name: 'Hint', value: 'Use /proposal-detail to query individual proposal details by ID' },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('All proposals query successful');
  } catch (error) {
    logger.error('All proposals query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /proposal-detail command
 */
export async function handleProposalDetailCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /proposal-detail <contract_hash> <proposal_id>\n\nQuery details of a single governance proposal.');
    return;
  }

  try {
    const contractHash = args[0];
    const proposalId = args[1];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let proposalsURef: string | null = null;
    const possibleNames = ['proposals', 'all_proposals', 'proposal_list'];

    for (const name of possibleNames) {
      proposalsURef = await getNamedKeyURef(contractHash, name);
      if (proposalsURef) break;
    }

    if (!proposalsURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find proposals URef in contract named keys'));
      return;
    }

    const result = await getDictionaryItem(proposalsURef, proposalId);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const proposalStr = parseCLValue(clValue);

    const response = createReadText('🗳️ Proposal Details', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Proposal ID', value: proposalId },
      { name: 'Proposal Data', value: truncate(proposalStr, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Proposal detail query successful');
  } catch (error) {
    logger.error('Proposal detail query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Handle /vote-record command
 */
export async function handleVoteRecordCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /vote-record <contract_hash> <proposal_id> <voter_public_key>\n\nQuery a user vote record on a proposal.');
    return;
  }

  try {
    const contractHash = args[0];
    const proposalId = args[1];
    const voter = args[2];

    if (!validateContractHash(contractHash) || !validatePublicKey(voter)) {
      await ctx.reply(createErrorText('Invalid Input', 'Check contract hash and voter public key'));
      return;
    }

    let votesURef: string | null = null;
    const possibleNames = ['votes', 'vote_records', 'voter_records'];

    for (const name of possibleNames) {
      votesURef = await getNamedKeyURef(contractHash, name);
      if (votesURef) break;
    }

    if (!votesURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find votes URef in contract named keys'));
      return;
    }

    const accountInfo = await getAccountInfo(voter);
    const accountHash = (accountInfo?.account?.account_hash || '').replace(/^account-hash-/, '');
    const dictKey = `${proposalId}_${accountHash}`;

    const result = await getDictionaryItem(votesURef, dictKey);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const voteStr = parseCLValue(clValue);

    const response = createReadText('🗳️ Vote Record', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Proposal ID', value: proposalId },
      { name: 'Voter', value: `\`${truncate(voter, 40)}\`` },
      { name: 'Vote', value: truncate(voteStr, 100) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Vote record query successful');
  } catch (error) {
    logger.error('Vote record query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

// ==================== RWA Handlers ====================

/**
 * Handle /asset-record command
 */
export async function handleAssetRecordCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /asset-record <contract_hash> <asset_id>\n\nQuery an RWA (Real World Asset) record on-chain.');
    return;
  }

  try {
    const contractHash = args[0];
    const assetId = args[1];

    if (!validateContractHash(contractHash)) {
      await ctx.reply(createErrorText('Invalid Hash', 'Contract hash must be 64 hex chars'));
      return;
    }

    let assetsURef: string | null = null;
    const possibleNames = ['assets', 'asset_records', 'records', 'rwa_assets'];

    for (const name of possibleNames) {
      assetsURef = await getNamedKeyURef(contractHash, name);
      if (assetsURef) break;
    }

    if (!assetsURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find assets URef in contract named keys'));
      return;
    }

    const result = await getDictionaryItem(assetsURef, assetId);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const assetStr = parseCLValue(clValue);

    const response = createReadText('📄 RWA Asset Record', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'Asset ID', value: assetId },
      { name: 'Asset Record', value: truncate(assetStr, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Asset record query successful');
  } catch (error) {
    logger.error('Asset record query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}

// ==================== DEX Order Handlers ====================

/**
 * Handle /open-orders command
 */
export async function handleOpenOrdersCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /open-orders <contract_hash> <user_public_key>\n\nQuery open orders for a user on a DEX.');
    return;
  }

  try {
    const contractHash = args[0];
    const user = args[1];

    if (!validateContractHash(contractHash) || !validatePublicKey(user)) {
      await ctx.reply(createErrorText('Invalid Input', 'Check contract hash and public key'));
      return;
    }

    let ordersURef: string | null = null;
    const possibleNames = ['user_orders', 'orders', 'open_orders', 'order_book'];

    for (const name of possibleNames) {
      ordersURef = await getNamedKeyURef(contractHash, name);
      if (ordersURef) break;
    }

    if (!ordersURef) {
      await ctx.reply(createErrorText('Not Found', 'Could not find orders URef in contract named keys'));
      return;
    }

    const accountInfo = await getAccountInfo(user);
    const accountHash = (accountInfo?.account?.account_hash || '').replace(/^account-hash-/, '');

    const result = await getDictionaryItem(ordersURef, accountHash);
    const clValue = result?.stored_value?.CLValue || result?.stored_value?.cl_value;
    const ordersStr = parseCLValue(clValue);

    const response = createReadText('📊 Open Orders', [
      { name: 'Contract Hash', value: `\`${truncate(contractHash, 40)}\`` },
      { name: 'User', value: `\`${truncate(user, 40)}\`` },
      { name: 'Open Orders', value: truncate(ordersStr, 200) },
    ]);

    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info('Open orders query successful');
  } catch (error) {
    logger.error('Open orders query failed:', error);
    await ctx.reply(createErrorText('Query Failed', error instanceof Error ? error.message : 'Unknown error'));
  }
}
