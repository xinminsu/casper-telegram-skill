import { Context } from 'telegraf';
import { logger } from '../../../utils/logger';
import {
  ammSwap, addLiquidity, removeLiquidity, stakeLp, claimReward,
  createOrder, cancelOrder,
  counterIncrement, counterDecrement,
  dictionaryPut, dictionaryRemove,
  createProposal, castVote, executeProposal,
  saveAssetRecord,
  callContract,
} from '../../../services/casperTransactionService';
import { CLValue } from 'casper-js-sdk';
import { createDeploySuccessText, checkSigningKey } from '../deployHelper';

function truncate(s: string, len = 20): string {
  return s.length > len ? s.substring(0, len) + '...' : s;
}

// DeFi handlers

export async function handleSwapCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 5) {
    await ctx.reply('❌ Usage: /swap <contract_hash> <token_in> <token_out> <amount_in> <min_amount_out> [decimals]\n\nSwap tokens on an AMM DEX.');
    return;
  }

  try {
    const contractHash = args[0];
    const tokenIn = args[1];
    const tokenOut = args[2];
    const amountIn = args[3];
    const minAmountOut = args[4];
    const decimals = args[5] ? parseInt(args[5]) : 9;

    const { deployHash, result } = await ammSwap(contractHash, tokenIn, tokenOut, amountIn, minAmountOut, decimals);
    const response = createDeploySuccessText('AMM Swap', deployHash, result, [
      { name: 'Token In', value: `\`${truncate(tokenIn)}\`` },
      { name: 'Token Out', value: `\`${truncate(tokenOut)}\`` },
      { name: 'Amount In', value: amountIn },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Swap successful: ${deployHash}`);
  } catch (error) {
    logger.error('Swap failed:', error);
    await ctx.reply(`❌ Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleAddLiquidityCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 5) {
    await ctx.reply('❌ Usage: /add-liquidity <contract_hash> <token_a> <token_b> <amount_a> <amount_b> [decimals]\n\nAdd liquidity to an AMM pool.');
    return;
  }

  try {
    const contractHash = args[0];
    const tokenA = args[1];
    const tokenB = args[2];
    const amountA = args[3];
    const amountB = args[4];
    const decimals = args[5] ? parseInt(args[5]) : 9;

    const { deployHash, result } = await addLiquidity(contractHash, tokenA, tokenB, amountA, amountB, decimals);
    const response = createDeploySuccessText('Add Liquidity', deployHash, result, [
      { name: 'Token A', value: `\`${truncate(tokenA)}\`` },
      { name: 'Token B', value: `\`${truncate(tokenB)}\`` },
      { name: 'Amount A', value: amountA },
      { name: 'Amount B', value: amountB },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Add liquidity successful: ${deployHash}`);
  } catch (error) {
    logger.error('Add liquidity failed:', error);
    await ctx.reply(`❌ Add liquidity failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleRemoveLiquidityCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 6) {
    await ctx.reply('❌ Usage: /remove-liquidity <contract_hash> <lp_token> <lp_amount> <min_amount_a> <min_amount_b> [decimals]\n\nRemove liquidity from an AMM pool.');
    return;
  }

  try {
    const contractHash = args[0];
    const lpToken = args[1];
    const lpAmount = args[2];
    const minAmountA = args[3];
    const minAmountB = args[4];
    const decimals = args[5] ? parseInt(args[5]) : 9;

    const { deployHash, result } = await removeLiquidity(contractHash, lpToken, lpAmount, minAmountA, minAmountB, decimals);
    const response = createDeploySuccessText('Remove Liquidity', deployHash, result, [
      { name: 'LP Token', value: `\`${truncate(lpToken)}\`` },
      { name: 'LP Amount', value: lpAmount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Remove liquidity successful: ${deployHash}`);
  } catch (error) {
    logger.error('Remove liquidity failed:', error);
    await ctx.reply(`❌ Remove liquidity failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleStakeLpCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /stake-lp <contract_hash> <lp_token> <amount> [decimals]\n\nStake LP tokens for farming rewards.');
    return;
  }

  try {
    const contractHash = args[0];
    const lpToken = args[1];
    const amount = args[2];
    const decimals = args[3] ? parseInt(args[3]) : 9;

    const { deployHash, result } = await stakeLp(contractHash, lpToken, amount, decimals);
    const response = createDeploySuccessText('Stake LP', deployHash, result, [
      { name: 'LP Token', value: `\`${truncate(lpToken)}\`` },
      { name: 'Amount', value: amount },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Stake LP successful: ${deployHash}`);
  } catch (error) {
    logger.error('Stake LP failed:', error);
    await ctx.reply(`❌ Stake LP failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleClaimRewardCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /claim-reward <contract_hash>\n\nClaim farming rewards.');
    return;
  }

  try {
    const contractHash = args[0];
    const { deployHash, result } = await claimReward(contractHash);
    const response = createDeploySuccessText('Claim Reward', deployHash, result, [
      { name: 'Contract', value: `\`${truncate(contractHash)}\`` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Claim reward successful: ${deployHash}`);
  } catch (error) {
    logger.error('Claim reward failed:', error);
    await ctx.reply(`❌ Claim reward failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleCreateOrderCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 5) {
    await ctx.reply('❌ Usage: /create-order <contract_hash> <token_in> <token_out> <amount_in> <price> [decimals]\n\nCreate a limit order on a DEX.');
    return;
  }

  try {
    const contractHash = args[0];
    const tokenIn = args[1];
    const tokenOut = args[2];
    const amountIn = args[3];
    const price = args[4];
    const decimals = args[5] ? parseInt(args[5]) : 9;

    const { deployHash, result } = await createOrder(contractHash, tokenIn, tokenOut, amountIn, price, decimals);
    const response = createDeploySuccessText('Create Order', deployHash, result, [
      { name: 'Token In', value: `\`${truncate(tokenIn)}\`` },
      { name: 'Token Out', value: `\`${truncate(tokenOut)}\`` },
      { name: 'Amount In', value: amountIn },
      { name: 'Price', value: price },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Create order successful: ${deployHash}`);
  } catch (error) {
    logger.error('Create order failed:', error);
    await ctx.reply(`❌ Create order failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleCancelOrderCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /cancel-order <contract_hash> <order_id>\n\nCancel a DEX limit order.');
    return;
  }

  try {
    const contractHash = args[0];
    const orderId = args[1];

    const { deployHash, result } = await cancelOrder(contractHash, orderId);
    const response = createDeploySuccessText('Cancel Order', deployHash, result, [
      { name: 'Order ID', value: orderId },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Cancel order successful: ${deployHash}`);
  } catch (error) {
    logger.error('Cancel order failed:', error);
    await ctx.reply(`❌ Cancel order failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// DApp handlers

export async function handleCounterIncrementCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /counter-increment <contract_hash>\n\nIncrement a counter contract.');
    return;
  }

  try {
    const contractHash = args[0];
    const { deployHash, result } = await counterIncrement(contractHash);
    const response = createDeploySuccessText('Counter Increment', deployHash, result, [
      { name: 'Contract', value: `\`${truncate(contractHash)}\`` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Counter increment successful: ${deployHash}`);
  } catch (error) {
    logger.error('Counter increment failed:', error);
    await ctx.reply(`❌ Counter increment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleCounterDecrementCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /counter-decrement <contract_hash>\n\nDecrement a counter contract.');
    return;
  }

  try {
    const contractHash = args[0];
    const { deployHash, result } = await counterDecrement(contractHash);
    const response = createDeploySuccessText('Counter Decrement', deployHash, result, [
      { name: 'Contract', value: `\`${truncate(contractHash)}\`` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Counter decrement successful: ${deployHash}`);
  } catch (error) {
    logger.error('Counter decrement failed:', error);
    await ctx.reply(`❌ Counter decrement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleDictPutCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /dict-put <contract_hash> <key> <value>\n\nWrite a key-value pair to a dictionary via contract.');
    return;
  }

  try {
    const contractHash = args[0];
    const key = args[1];
    const value = args[2];

    const { deployHash, result } = await dictionaryPut(contractHash, key, value);
    const response = createDeploySuccessText('Dictionary Put', deployHash, result, [
      { name: 'Key', value: key },
      { name: 'Value', value: truncate(value, 50) },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Dict put successful: ${deployHash}`);
  } catch (error) {
    logger.error('Dict put failed:', error);
    await ctx.reply(`❌ Dict put failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleDictRemoveCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /dict-remove <contract_hash> <key>\n\nRemove a key from a dictionary via contract.');
    return;
  }

  try {
    const contractHash = args[0];
    const key = args[1];

    const { deployHash, result } = await dictionaryRemove(contractHash, key);
    const response = createDeploySuccessText('Dictionary Remove', deployHash, result, [
      { name: 'Removed Key', value: key },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Dict remove successful: ${deployHash}`);
  } catch (error) {
    logger.error('Dict remove failed:', error);
    await ctx.reply(`❌ Dict remove failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleCreateProposalCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 4) {
    await ctx.reply('❌ Usage: /create-proposal <contract_hash> <title> <description> <voting_duration>\n\nCreate a governance proposal. Voting duration in blocks.');
    return;
  }

  try {
    const contractHash = args[0];
    const title = args[1];
    const description = args[2];
    const votingDuration = parseInt(args[3]);

    const { deployHash, result } = await createProposal(contractHash, title, description, votingDuration);
    const response = createDeploySuccessText('Create Proposal', deployHash, result, [
      { name: 'Title', value: title },
      { name: 'Voting Duration', value: `${votingDuration} blocks` },
      { name: 'Description', value: truncate(description, 100) },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Create proposal successful: ${deployHash}`);
  } catch (error) {
    logger.error('Create proposal failed:', error);
    await ctx.reply(`❌ Create proposal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleCastVoteCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 3) {
    await ctx.reply('❌ Usage: /cast-vote <contract_hash> <proposal_id> <vote>\n\nCast a vote on a governance proposal. Vote: "for" or "against".');
    return;
  }

  try {
    const contractHash = args[0];
    const proposalId = args[1];
    const vote = args[2];

    if (!['for', 'against'].includes(vote)) {
      await ctx.reply('❌ Vote must be "for" or "against".');
      return;
    }

    const { deployHash, result } = await castVote(contractHash, proposalId, vote);
    const response = createDeploySuccessText('Cast Vote', deployHash, result, [
      { name: 'Proposal ID', value: proposalId },
      { name: 'Vote', value: vote },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Cast vote successful: ${deployHash}`);
  } catch (error) {
    logger.error('Cast vote failed:', error);
    await ctx.reply(`❌ Cast vote failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleExecuteProposalCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /execute-proposal <contract_hash> <proposal_id>\n\nExecute a passed governance proposal.');
    return;
  }

  try {
    const contractHash = args[0];
    const proposalId = args[1];

    const { deployHash, result } = await executeProposal(contractHash, proposalId);
    const response = createDeploySuccessText('Execute Proposal', deployHash, result, [
      { name: 'Proposal ID', value: proposalId },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Execute proposal successful: ${deployHash}`);
  } catch (error) {
    logger.error('Execute proposal failed:', error);
    await ctx.reply(`❌ Execute proposal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleSaveAssetCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 4) {
    await ctx.reply('❌ Usage: /save-asset <contract_hash> <asset_id> <owner_hash> <document_hash> [metadata]\n\nSave an RWA asset record to the blockchain.');
    return;
  }

  try {
    const contractHash = args[0];
    const assetId = args[1];
    const ownerHash = args[2];
    const documentHash = args[3];
    const metadata = args[4] || undefined;

    const { deployHash, result } = await saveAssetRecord(contractHash, assetId, ownerHash, documentHash, metadata);
    const response = createDeploySuccessText('Save RWA Asset', deployHash, result, [
      { name: 'Asset ID', value: assetId },
      { name: 'Owner Hash', value: `\`${truncate(ownerHash)}\`` },
      { name: 'Document Hash', value: `\`${truncate(documentHash)}\`` },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Save asset successful: ${deployHash}`);
  } catch (error) {
    logger.error('Save asset failed:', error);
    await ctx.reply(`❌ Save asset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generic contract call handler

export async function handleCallContractCommand(ctx: Context) {
  const keyError = checkSigningKey();
  if (keyError) { await ctx.reply(keyError); return; }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 2) {
    await ctx.reply('❌ Usage: /call-contract <contract_hash> <entry_point> [args_json]\n\nCall a stored contract by hash (generic entry point).\nArgs JSON format: {"key":"value"}');
    return;
  }

  try {
    const contractHash = args[0];
    const entryPoint = args[1];
    const argsJson = args[2];

    // Parse args JSON into CLValue map
    const argsMap = new Map<string, CLValue>();
    if (argsJson) {
      try {
        const parsed = JSON.parse(argsJson);
        for (const [key, value] of Object.entries(parsed)) {
          argsMap.set(key, CLValue.newCLString(String(value)));
        }
      } catch {
        await ctx.reply('❌ Invalid args JSON. Use format: {"key":"value"}');
        return;
      }
    }

    const { deployHash, result } = await callContract(contractHash, entryPoint, argsMap);
    const response = createDeploySuccessText('Contract Call', deployHash, result, [
      { name: 'Contract', value: `\`${truncate(contractHash)}\`` },
      { name: 'Entry Point', value: entryPoint },
    ]);
    await ctx.reply(response, { parse_mode: 'Markdown' });
    logger.info(`Contract call successful: ${deployHash}`);
  } catch (error) {
    logger.error('Contract call failed:', error);
    await ctx.reply(`❌ Contract call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
