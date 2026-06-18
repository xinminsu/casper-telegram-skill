import { Context } from 'telegraf';
import { logger } from '../../utils/logger';

export async function handlePushCommand(ctx: Context) {
  // Get command arguments from message text
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1); // Remove command name
  
  if (args.length < 1) {
    await ctx.reply('❌ Usage: /push <message>');
    return;
  }

  const message = args.join(' ');

  try {
    // Send message to current chat
    await ctx.reply(`📢 *Casper Notification*\n\n${message}`, { parse_mode: 'Markdown' });

    await ctx.reply('✅ Message pushed successfully');

    logger.info(`Message pushed to chat: ${ctx.chat?.id}`);
  } catch (error) {
    logger.error('Message push failed:', error);
    await ctx.reply(`❌ Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
