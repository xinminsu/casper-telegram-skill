import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getEthBalance, getTokenBalance } from '../services/web3Service';
import { logger } from '../utils/logger';

export async function handleBalanceCommand(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const address = interaction.options.getString('address', true);
  const token = interaction.options.getString('token');

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    await interaction.editReply({
      content: '❌ Invalid wallet address format',
    });
    return;
  }

  try {
    let balanceInfo: string;
    let title: string;

    if (token) {
      // Query ERC20 token balance
      if (!/^0x[a-fA-F0-9]{40}$/.test(token)) {
        await interaction.editReply({
          content: '❌ Invalid token contract address format',
        });
        return;
      }

      balanceInfo = await getTokenBalance(token, address);
      title = `💰 Pharos Token Balance`;
    } else {
      // Query ETH balance
      balanceInfo = await getEthBalance(address);
      title = `💰 Pharos ETH Balance`;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(0x0099FF)
      .addFields(
        { name: 'Wallet Address', value: `\`${address}\``, inline: false },
        { name: 'Balance', value: `\`${balanceInfo}\``, inline: false },
        { name: 'Network', value: 'Pharos', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Pharos Discord Bot' });

    await interaction.editReply({
      embeds: [embed],
    });

    logger.info(`Query balance: ${address} on Pharos`);
  } catch (error) {
    logger.error('Balance query failed:', error);
    await interaction.editReply({
      content: `❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
