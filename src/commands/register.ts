import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { commands } from './commands';
import { logger } from '../utils/logger';

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  logger.error('Error: Please configure DISCORD_TOKEN and DISCORD_CLIENT_ID in .env file');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

export async function registerCommands() {
  try {
    logger.info(`Starting to register ${commands.length} slash commands...`);

    if (!CLIENT_ID) {
      throw new Error('CLIENT_ID not defined');
    }

    // Register global commands
    const data = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands.map(cmd => cmd.toJSON()) }
    );

    logger.info(`Successfully registered ${(data as any[]).length} slash commands`);
  } catch (error) {
    logger.error('Command registration failed:', error);
    throw error;
  }
}
