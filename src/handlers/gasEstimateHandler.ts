import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { estimateGas } from '../services/web3Service';
import { logger } from '../utils/logger';

export async function handleGasEstimateCommand(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const from = interaction.options.getString('from', true);
  const to = interaction.options.getString('to', true);
  const value = interaction.options.getString('value') || '0';

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(from) || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
    await interaction.editReply({
      content: '❌ Invalid wallet address format',
    });
    return;
  }

  try {
    const gasInfo = await estimateGas(from, to, value, '0x');

    const embed = new EmbedBuilder()
      .setTitle('⛽ Gas Estimation Result')
      .setColor(0xFFA500)
      .addFields(
        { name: 'From', value: `\`${from}\``, inline: false },
        { name: 'To', value: `\`${to}\``, inline: false },
        { name: 'Amount', value: `${value} ETH`, inline: true },
        { name: 'Network', value: 'Pharos', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Gas Limit', value: `\`${gasInfo.gasLimit}\``, inline: true },
        { name: 'Gas Price', value: `\`${gasInfo.gasPrice}\``, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Max Fee Per Gas', value: `\`${gasInfo.maxFeePerGas}\``, inline: true },
        { name: 'Priority Fee', value: `\`${gasInfo.maxPriorityFeePerGas}\``, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Estimated Total Cost', value: `\`${gasInfo.estimatedCost}\``, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Pharos Discord Bot' });

    await interaction.editReply({
      embeds: [embed],
    });

    logger.info(`Gas estimate: ${from} -> ${to} on Pharos`);
  } catch (error) {
    logger.error('Gas estimation failed:', error);
    await interaction.editReply({
      content: `❌ Estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
