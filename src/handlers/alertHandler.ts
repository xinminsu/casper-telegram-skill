import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger';

// Simple in-memory storage (production should use database)
interface Alert {
  id: string;
  type: string;
  address?: string;
  threshold?: number;
  message?: string;
  channelId: string;
  createdAt: Date;
}

const alerts: Map<string, Alert> = new Map();

export async function handleAlertCommand(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'add':
      await handleAddAlert(interaction);
      break;
    case 'list':
      await handleListAlerts(interaction);
      break;
    case 'remove':
      await handleRemoveAlert(interaction);
      break;
  }
}

async function handleAddAlert(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const type = interaction.options.getString('type', true);
  const address = interaction.options.getString('address');
  const threshold = interaction.options.getNumber('threshold');
  const message = interaction.options.getString('message');

  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const alert: Alert = {
    id: alertId,
    type,
    address: address || undefined,
    threshold: threshold || undefined,
    message: message || undefined,
    channelId: interaction.channelId,
    createdAt: new Date(),
  };

  alerts.set(alertId, alert);

  const embed = new EmbedBuilder()
    .setTitle('✅ Alert Created')
    .setColor(0x00FF00)
    .addFields(
      { name: 'Alert ID', value: `\`${alertId}\``, inline: false },
      { name: 'Type', value: type, inline: true },
      { name: 'Channel', value: `<#${interaction.channelId}>`, inline: true }
    )
    .setTimestamp();

  if (address) {
    embed.addFields({ name: 'Monitored Address', value: `\`${address}\``, inline: false });
  }
  if (threshold) {
    embed.addFields({ name: 'Threshold', value: `${threshold}`, inline: true });
  }
  if (message) {
    embed.addFields({ name: 'Message', value: message, inline: false });
  }

  await interaction.editReply({
    embeds: [embed],
  });

  logger.info(`Alert created: ${alertId} (${type})`);
}

async function handleListAlerts(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const userAlerts = Array.from(alerts.values()).filter(
    alert => alert.channelId === interaction.channelId
  );

  if (userAlerts.length === 0) {
    await interaction.editReply({
      content: '📭 No alerts set up in current channel',
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📋 Alert List')
    .setColor(0x0099FF)
    .setDescription(`Total ${userAlerts.length} alerts`)
    .setTimestamp();

  userAlerts.forEach((alert, index) => {
    embed.addFields({
      name: `${index + 1}. ${alert.type}`,
      value: `ID: \`${alert.id}\`\n${alert.address ? `Address: \`${alert.address}\`` : ''}${alert.threshold ? `\nThreshold: ${alert.threshold}` : ''}`,
      inline: false,
    });
  });

  await interaction.editReply({
    embeds: [embed],
  });
}

async function handleRemoveAlert(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const alertId = interaction.options.getString('id', true);

  if (!alerts.has(alertId)) {
    await interaction.editReply({
      content: '❌ Alert ID not found',
    });
    return;
  }

  alerts.delete(alertId);

  await interaction.editReply({
    content: `✅ Alert \`${alertId}\` deleted`,
  });

  logger.info(`Alert deleted: ${alertId}`);
}

// Export alerts for scheduled tasks
export { alerts };
