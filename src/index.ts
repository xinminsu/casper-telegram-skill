import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { registerCommands } from './commands/register';
import { handleInteraction } from './handlers/interactionHandler';
import { logger } from './utils/logger';
import { startAlertService } from './services/alertService';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Bot ready event
client.once('ready', () => {
  logger.info(`Pharos Bot is online! Username: ${client.user?.tag}`);
  logger.info(`Currently serving ${client.guilds.cache.size} servers`);
});

// Handle interaction events
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await handleInteraction(interaction);
  }
});

// Error handling
client.on('error', (error) => {
  logger.error('Discord client error:', error);
});

process.on('unhandledRejection', (error: any) => {
  logger.error('Unhandled Promise rejection:', error);
});

// Start the bot
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  logger.error('Error: DISCORD_TOKEN not configured in .env file');
  process.exit(1);
}

// Register commands and login
registerCommands()
  .then(() => {
    logger.info('Commands registered, logging in...');
    return client.login(TOKEN);
  })
  .then(() => {
    logger.info('Pharos Bot logged in successfully!');
    // Start alert service
    startAlertService();
  })
  .catch((error: any) => {
    logger.error('Login failed:', error);
    process.exit(1);
  });

export { client };
