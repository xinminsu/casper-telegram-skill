import { Context } from 'telegraf';
import { logger } from '../../utils/logger';

// Simple in-memory storage (production should use database)
interface Alert {
  id: string;
  type: string;
  address?: string;
  threshold?: number;
  message?: string;
  chatId: number;
  createdAt: Date;
}

const alerts: Map<string, Alert> = new Map();

export async function handleAlertAdd(ctx: Context) {
  // Get command arguments from message text
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1); // Remove command name
  
  if (args.length < 1) {
    await ctx.reply('❌ Usage: /alert-add <type> [address] [threshold] [message]\nTypes: balance, gas, custom');
    return;
  }

  const type = args[0];
  const address = args[1];
  const threshold = args[2] ? parseFloat(args[2]) : undefined;
  const message = args.slice(3).join(' ') || undefined;

  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const alert: Alert = {
    id: alertId,
    type,
    address: address || undefined,
    threshold: threshold || undefined,
    message: message || undefined,
    chatId: ctx.chat?.id || 0,
    createdAt: new Date(),
  };

  alerts.set(alertId, alert);

  let response = 
    `✅ Alert Created\n\n` +
    `*Alert ID:* \`${alertId}\`\n` +
    `*Type:* ${type}\n`;
  
  if (address) {
    response += `*Monitored Address:* \`${address}\`\n`;
  }
  if (threshold) {
    response += `*Threshold:* ${threshold}\n`;
  }
  if (message) {
    response += `*Message:* ${message}\n`;
  }

  await ctx.reply(response, { parse_mode: 'Markdown' });

  logger.info(`Alert created: ${alertId} (${type})`);
}

export async function handleAlertList(ctx: Context) {
  const chatId = ctx.chat?.id || 0;
  const userAlerts = Array.from(alerts.values()).filter(
    alert => alert.chatId === chatId
  );

  if (userAlerts.length === 0) {
    await ctx.reply('📭 No alerts set up in current chat');
    return;
  }

  let response = `📋 Alert List\n\nTotal ${userAlerts.length} alerts\n\n`;
  
  userAlerts.forEach((alert, index) => {
    response += `${index + 1}. *${alert.type}*\n`;
    response += `ID: \`${alert.id}\`\n`;
    if (alert.address) {
      response += `Address: \`${alert.address}\`\n`;
    }
    if (alert.threshold) {
      response += `Threshold: ${alert.threshold}\n`;
    }
    response += '\n';
  });

  await ctx.reply(response, { parse_mode: 'Markdown' });
}

export async function handleAlertRemove(ctx: Context) {
  // Get command arguments from message text
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1); // Remove command name
  
  if (args.length < 1) {
    await ctx.reply('❌ Usage: /alert-remove <alert_id>');
    return;
  }

  const alertId = args[0];

  if (!alerts.has(alertId)) {
    await ctx.reply('❌ Alert ID not found');
    return;
  }

  alerts.delete(alertId);

  await ctx.reply(`✅ Alert \`${alertId}\` deleted`);

  logger.info(`Alert deleted: ${alertId}`);
}

// Export alerts for scheduled tasks
export { alerts };
