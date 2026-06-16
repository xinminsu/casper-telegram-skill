import { ChatInputCommandInteraction } from 'discord.js';
import { handleBalanceCommand } from './balanceHandler';
import { handleGasEstimateCommand } from './gasEstimateHandler';
import { handleGasPriceCommand } from './gasPriceHandler';
import { handleAlertCommand } from './alertHandler';
import { handlePushCommand } from './pushHandler';
import { logger } from '../utils/logger';

export async function handleInteraction(interaction: ChatInputCommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;

  try {
    switch (commandName) {
      case 'balance':
        await handleBalanceCommand(interaction);
        break;
      
      case 'gas-estimate':
        await handleGasEstimateCommand(interaction);
        break;
      
      case 'gas-price':
        await handleGasPriceCommand(interaction);
        break;
      
      case 'alert':
        await handleAlertCommand(interaction);
        break;
      
      case 'push':
        await handlePushCommand(interaction);
        break;
      
      default:
        logger.warn(`Unknown command: ${commandName}`);
    }
  } catch (error) {
    logger.error(`Error processing command ${commandName}:`, error);
    
    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Error processing command, please try again later',
        ephemeral: true,
      });
    }
  }
}
