import { ChatInputCommandInteraction } from 'discord.js';
import { logger } from '../utils/logger';

export async function handlePushCommand(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const message = interaction.options.getString('message', true);
  const channel = interaction.options.getChannel('channel');

  try {
    const targetChannel = channel || interaction.channel;

    if (!targetChannel || !('send' in targetChannel)) {
      await interaction.editReply({
        content: '❌ Cannot find target channel',
      });
      return;
    }

    // Send message to specified channel
    await targetChannel.send({
      content: `📢 **Pharos Notification**\n\n${message}`,
    });

    await interaction.editReply({
      content: '✅ Message pushed successfully',
    });

    logger.info(`Message pushed to channel: ${targetChannel.id}`);
  } catch (error) {
    logger.error('Message push failed:', error);
    await interaction.editReply({
      content: `❌ Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
