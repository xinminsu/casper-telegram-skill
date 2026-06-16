import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getCurrentGasPrice } from '../services/web3Service';
import { logger } from '../utils/logger';

export async function handleGasPriceCommand(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const gasPrices = await getCurrentGasPrice();

    const embed = new EmbedBuilder()
      .setTitle('⛽ Current Gas Price')
      .setColor(0x00FF00)
      .addFields(
        { name: 'Network', value: 'PHAROS', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Gas Price', value: `\`${gasPrices.gasPrice}\``, inline: true },
        { name: 'Max Fee Per Gas', value: `\`${gasPrices.maxFeePerGas}\``, inline: true },
        { name: 'Priority Fee', value: `\`${gasPrices.maxPriorityFeePerGas}\``, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Pharos Discord Bot' });

    await interaction.editReply({
      embeds: [embed],
    });

    logger.info(`Query Gas price: Pharos`);
  } catch (error) {
    logger.error('Gas price query failed:', error);
    await interaction.editReply({
      content: `❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
