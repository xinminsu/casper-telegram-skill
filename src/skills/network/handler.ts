import { Context } from 'telegraf';
import { logger } from '../../utils/logger';
import {
  getNodeStatus,
  getPeers,
  getBlockByHash,
  getBlockByHeight,
  getDeploy,
  getBlockTransfers,
  getEraInfo,
  getStateRootHash,
  getAuctionInfo,
  getChainspec,
} from '../../services/casperRpcService';

/**
 * Truncate a string for display
 */
function truncate(str: string, maxLen: number = 50): string {
  if (!str) return 'N/A';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

/**
 * Format timestamp
 */
function formatTimestamp(ts?: number): string {
  if (!ts) return 'N/A';
  return new Date(ts).toUTCString();
}

/**
 * Handle /node-status command
 */
export async function handleNodeStatusCommand(ctx: Context) {
  try {
    const status = await getNodeStatus();

    let text = `🌐 *Casper Node Status*\n\n`;
    text += `*Chain Name:* ${status.chainspec_name || 'N/A'}\n`;
    text += `*API Version:* ${status.api_version || 'N/A'}\n`;
    text += `*Starting State Root Hash:* \`${truncate(status.starting_state_root_hash, 30)}\`\n`;
    text += `*Last Added Block Hash:* \`${truncate(status.last_added_block_info?.hash, 30)}\`\n`;
    text += `*Last Added Block Height:* ${status.last_added_block_info?.height?.toString() || 'N/A'}\n`;
    text += `*Last Added Block Timestamp:* ${formatTimestamp(status.last_added_block_info?.timestamp)}\n`;
    text += `*Our Public Key:* \`${truncate(status.our_public_signing_key, 30)}\`\n`;
    text += `*Peers:* ${status.peers?.length?.toString() || '0'}\n`;
    text += `*Build Version:* ${status.build_version || 'N/A'}`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info('Node status query successful');
  } catch (error) {
    logger.error('Node status query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /peers command
 */
export async function handlePeersCommand(ctx: Context) {
  try {
    const result = await getPeers();
    const peers = result.peers || [];

    let text = `🔌 *Casper Network Peers*\n\n`;
    text += `*Total Peers:* ${peers.length}\n\n`;

    // Show up to 10 peers
    const peerList = peers.slice(0, 10).map((peer: any, i: number) =>
      `${i + 1}. \`${peer.node_id}\` - ${peer.address}`
    ).join('\n') || 'No peers found';

    text += `*Peer List (Top 10):*\n${peerList}`;

    if (peers.length > 10) {
      text += `\n\n_Showing 10 of ${peers.length} peers_`;
    }

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info(`Peers query successful: ${peers.length} peers`);
  } catch (error) {
    logger.error('Peers query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /block command
 */
export async function handleBlockCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  try {
    let result;
    if (args.length > 0 && args[0].startsWith('0x') || (args.length > 0 && args[0].length > 20 && !/^\d+$/.test(args[0]))) {
      // Hash provided
      result = await getBlockByHash(args[0]);
    } else if (args.length > 0 && /^\d+$/.test(args[0])) {
      // Height provided
      result = await getBlockByHeight(parseInt(args[0]));
    } else {
      // Get latest block
      result = await getBlockByHeight(0);
    }

    const block = result.block;
    if (!block) {
      await ctx.reply('❌ Block not found');
      return;
    }

    const header = block.header || {};
    const body = block.body || {};

    let text = `📦 *Casper Block Information*\n\n`;
    text += `*Block Hash:* \`${truncate(block.hash, 40)}\`\n`;
    text += `*Height:* ${header.height?.toString() || 'N/A'}\n`;
    text += `*Era:* ${header.era_id?.toString() || 'N/A'}\n`;
    text += `*Timestamp:* ${formatTimestamp(header.timestamp)}\n`;
    text += `*State Root Hash:* \`${truncate(header.state_root_hash, 30)}\`\n`;
    text += `*Parent Hash:* \`${truncate(header.parent_hash, 30)}\`\n`;
    text += `*Proposer:* \`${truncate(header.proposer, 30)}\`\n`;
    text += `*Deploy Count:* ${body.deploy_hashes?.length?.toString() || '0'}\n`;
    text += `*Transfer Count:* ${body.transfer_hashes?.length?.toString() || '0'}`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info('Block query successful');
  } catch (error) {
    logger.error('Block query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /deploy command
 */
export async function handleDeployCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('❌ Usage: /deploy <hash>\n\nQuery deploy/transaction information by hash.');
    return;
  }

  try {
    const hash = args[0];
    const result = await getDeploy(hash);

    const deploy = result.deploy;
    if (!deploy) {
      await ctx.reply('❌ Deploy not found');
      return;
    }

    const header = deploy.header || {};

    let text = `📝 *Casper Deploy Information*\n\n`;
    text += `*Deploy Hash:* \`${truncate(hash, 40)}\`\n`;
    text += `*Account:* \`${truncate(header.account, 30)}\`\n`;
    text += `*Timestamp:* ${formatTimestamp(header.timestamp)}\n`;
    text += `*TTL:* ${header.ttl?.toString() || 'N/A'}\n`;
    text += `*Gas Price:* ${header.gas_price?.toString() || 'N/A'}\n`;
    text += `*Body Hash:* \`${truncate(header.body_hash, 30)}\`\n`;
    text += `*Chain Name:* ${header.chain_name || 'N/A'}\n`;
    text += `*Dependencies:* ${header.dependencies?.length?.toString() || '0'}`;

    // Add execution results if available
    const executionResults = result.execution_results || [];
    if (executionResults.length > 0) {
      const firstResult = executionResults[0];
      text += `\n\n*Execution Result:* ${firstResult.result?.Success ? '✅ Success' : '❌ Failed'}`;
      text += `\n*Block Hash:* \`${truncate(firstResult.block_hash, 30)}\``;

      if (firstResult.result?.Success) {
        const success = firstResult.result.Success;
        text += `\n*Gas Consumed:* ${success.cost || 'N/A'}`;
        text += `\n*Transfer Count:* ${success.effect?.transfers?.length?.toString() || '0'}`;
      }
    }

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info('Deploy query successful');
  } catch (error) {
    logger.error('Deploy query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /validators command
 */
export async function handleValidatorsCommand(ctx: Context) {
  try {
    const result = await getAuctionInfo();
    const auctionState = result.auction_state || {};

    let text = `⚖️ *Casper Network Validators*\n\n`;
    text += `*Era ID:* ${auctionState.era_id?.toString() || 'N/A'}\n`;
    text += `*State Root Hash:* \`${truncate(auctionState.state_root_hash, 30)}\`\n`;
    text += `*Total Validators:* ${auctionState.bids?.length?.toString() || '0'}\n`;

    // Show top 5 validators
    const bids = auctionState.bids || [];
    const activeValidators = bids.filter((b: any) => b.bid?.staked_amount);

    const topValidators = activeValidators
      .sort((a: any, b: any) => {
        const aStake = parseFloat(a.bid?.staked_amount || '0');
        const bStake = parseFloat(b.bid?.staked_amount || '0');
        return bStake - aStake;
      })
      .slice(0, 5);

    if (topValidators.length > 0) {
      text += `\n*Top 5 Validators by Stake:*\n`;
      const validatorList = topValidators.map((v: any, i: number) => {
        const stake = parseFloat(v.bid?.staked_amount || '0');
        const stakeCSPR = (stake / 1e9).toFixed(2);
        return `${i + 1}. Public Key: \`${truncate(v.public_key, 25)}\`\n   Staked: ${stakeCSPR} CSPR`;
      }).join('\n\n');
      text += validatorList;
    }

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info('Validators query successful');
  } catch (error) {
    logger.error('Validators query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /era command
 */
export async function handleEraCommand(ctx: Context) {
  try {
    const result = await getEraInfo();
    const eraSummary = result.era_summary || {};

    let text = `📅 *Casper Era Information*\n\n`;
    text += `*Era ID:* ${eraSummary.era_id?.toString() || 'N/A'}\n`;
    text += `*Block Hash:* \`${truncate(eraSummary.block_hash, 30)}\`\n`;
    text += `*State Root Hash:* \`${truncate(eraSummary.state_root_hash, 30)}\``;

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info('Era query successful');
  } catch (error) {
    logger.error('Era query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /state-root-hash command
 */
export async function handleStateRootHashCommand(ctx: Context) {
  try {
    const stateRootHash = await getStateRootHash();

    let text = `🌳 *Casper State Root Hash*\n\n`;
    text += `*Latest State Root Hash:* \`${stateRootHash}\``;

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info(`State root hash query successful: ${stateRootHash}`);
  } catch (error) {
    logger.error('State root hash query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /transfers command
 */
export async function handleTransfersCommand(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  try {
    const blockHash = args[0] || undefined;
    const result = await getBlockTransfers(blockHash);

    const transfers = result.transfers || [];

    let text = `💸 *Casper Block Transfers*\n\n`;
    text += `*Block Hash:* \`${truncate(result.block_hash, 30)}\`\n`;
    text += `*Total Transfers:* ${transfers.length}\n`;

    // Show up to 5 transfers
    if (transfers.length > 0) {
      const transferList = transfers.slice(0, 5).map((t: any, i: number) => {
        const amount = parseFloat(t.amount || '0') / 1e9;
        return `${i + 1}. From: \`${truncate(t.from, 20)}\`\n   To: \`${truncate(t.to, 20)}\`\n   Amount: ${amount.toFixed(4)} CSPR`;
      }).join('\n\n');

      text += `\n*Recent Transfers (Top 5):*\n${transferList}`;

      if (transfers.length > 5) {
        text += `\n\n_Showing 5 of ${transfers.length} transfers_`;
      }
    } else {
      text += `\n*Transfers:* No transfers in this block`;
    }

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info(`Transfers query successful: ${transfers.length} transfers`);
  } catch (error) {
    logger.error('Transfers query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle /chainspec command
 */
export async function handleChainspecCommand(ctx: Context) {
  try {
    const result = await getChainspec();
    const chainspec = result.chainspec_bytes || {};

    let text = `📋 *Casper Chainspec*\n\n`;
    text += `*API Version:* ${result.api_version || 'N/A'}\n`;

    if (chainspec.chainspec_bytes) {
      // Try to parse if it's a string
      try {
        const parsed = JSON.parse(chainspec.chainspec_bytes);
        text += `*Network Name:* ${parsed.network?.name || 'N/A'}\n`;
        text += `*Chain ID:* ${parsed.network?.chain_id?.toString() || 'N/A'}`;
      } catch {
        text += `*Chainspec:* Raw bytes available (not parseable as JSON)`;
      }
    }

    await ctx.reply(text, { parse_mode: 'Markdown' });
    logger.info('Chainspec query successful');
  } catch (error) {
    logger.error('Chainspec query failed:', error);
    await ctx.reply(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
