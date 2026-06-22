import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { SkillManager } from './core/SkillManager';
import { BalanceSkill } from './skills/balance';
import { GasSkill } from './skills/gas';
import { AlertSkill } from './skills/alert';
import { PushSkill } from './skills/push';
import { NetworkSkill } from './skills/network';
import {
  AccountReadSkill,
  ContractReadSkill,
  TokenReadSkill,
  StakingReadSkill,
  DappReadSkill,
} from './skills/read';
import {
  NativeWriteSkill,
  TokenWriteSkill,
  NftWriteSkill,
  StakingWriteSkill,
  DefiWriteSkill,
} from './skills/write';
import { logger } from './utils/logger';

dotenv.config();

// Create Telegram bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Create Skill Manager
const skillManager = new SkillManager();

// Bot ready event
bot.launch();

// Initialize bot after launch
(async () => {
  logger.info('Casper Telegram Bot is online!');
  
  // Initialize Skill Manager
  await skillManager.initialize();
  
  // Register all skills
  const skills = [
    new BalanceSkill(),
    new GasSkill(),
    new AlertSkill(),
    new PushSkill(),
    new NetworkSkill(),
    // Read skills
    new AccountReadSkill(),
    new ContractReadSkill(),
    new TokenReadSkill(),
    new StakingReadSkill(),
    new DappReadSkill(),
    // Write skills
    new NativeWriteSkill(),
    new TokenWriteSkill(),
    new NftWriteSkill(),
    new StakingWriteSkill(),
    new DefiWriteSkill(),
  ];
  
  for (const skill of skills) {
    await skillManager.registerSkill(skill);
  }
  
  logger.info(`Registered ${skillManager.getSkillCount()} skills`);
  
  // Setup command handlers
  setupCommandHandlers();
  
  logger.info('Bot is ready to handle commands!');
})();

// Error handling
bot.catch((err, ctx) => {
  logger.error(`Telegram Bot error for ${ctx.updateType}:`, err);
});

process.on('unhandledRejection', (error: any) => {
  logger.error('Unhandled Promise rejection:', error);
});

// Graceful shutdown
const gracefulStop = () => {
  logger.info('Shutting down...');
  skillManager.shutdown().then(() => {
    bot.stop('SIGINT');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulStop);
process.on('SIGTERM', gracefulStop);

/**
 * Setup command handlers for Telegram
 */
function setupCommandHandlers() {
  // Collect all commands from skills
  const allSkills = skillManager.getAllSkills();
  const allCommands = allSkills.flatMap(skill => skill.commands);
  
  logger.info(`Setting up ${allCommands.length} commands...`);
  
  // Register each command
  for (const skill of allSkills) {
    for (const commandName of skill.commands) {
      bot.command(commandName, async (ctx) => {
        await skillManager.handleCommand(ctx, commandName);
      });
    }
  }
  
  // Help command
  bot.command('help', (ctx) => {
    const helpText = allSkills.map(skill => {
      const cmds = skill.commands.map(cmd => `/${cmd}`).join(', ');
      return `*${skill.name}* (${skill.version}):\n${skill.description}\nCommands: ${cmds}`;
    }).join('\n\n');
    
    ctx.reply(
      `🤖 Casper Telegram Bot\n\nAvailable Skills:\n\n${helpText}`,
      { parse_mode: 'Markdown' }
    );
  });
  
  // Start command
  bot.start((ctx) => {
    ctx.reply(
      '👋 Welcome to Casper Telegram Bot!\n\n' +
      'Use /help to see available commands.\n' +
      'This bot provides blockchain services for Casper network.'
    );
  });
}

export { bot, skillManager };
