import { SlashCommandBuilder } from 'discord.js';

// Balance query command
export const balanceCommand = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Query wallet balance')
  .addStringOption(option =>
    option.setName('address')
      .setDescription('Wallet address')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('token')
      .setDescription('Token contract address (optional, leave blank to query ETH balance)')
      .setRequired(false)
  );

// Gas estimation command
export const gasEstimateCommand = new SlashCommandBuilder()
  .setName('gas-estimate')
  .setDescription('Estimate transaction Gas fees')
  .addStringOption(option =>
    option.setName('from')
      .setDescription('Sender address')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('to')
      .setDescription('Receiver address')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('value')
      .setDescription('Transfer amount (ETH)')
      .setRequired(false)
  );

// Gas price query command
export const gasPriceCommand = new SlashCommandBuilder()
  .setName('gas-price')
  .setDescription('Query current Gas price');

// Event alert setup command
export const alertCommand = new SlashCommandBuilder()
  .setName('alert')
  .setDescription('Set up blockchain event alerts')
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Add new alert')
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Alert type')
          .setRequired(true)
          .addChoices(
            { name: 'Balance Change', value: 'balance' },
            { name: 'Gas Price', value: 'gas' },
            { name: 'Custom Message', value: 'custom' }
          )
      )
      .addStringOption(option =>
        option.setName('address')
          .setDescription('Monitored wallet address')
          .setRequired(false)
      )
      .addNumberOption(option =>
        option.setName('threshold')
          .setDescription('Trigger threshold')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('message')
          .setDescription('Custom message content')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List all alerts')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Remove alert')
      .addStringOption(option =>
        option.setName('id')
          .setDescription('Alert ID')
          .setRequired(true)
      )
  );

// Push message command
export const pushCommand = new SlashCommandBuilder()
  .setName('push')
  .setDescription('Push message to channel')
  .addStringOption(option =>
    option.setName('message')
      .setDescription('Message content to push')
      .setRequired(true)
  )
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('Target channel (optional, defaults to current channel)')
      .setRequired(false)
  );

// Export all commands
export const commands = [
  balanceCommand,
  gasEstimateCommand,
  gasPriceCommand,
  alertCommand,
  pushCommand,
];
