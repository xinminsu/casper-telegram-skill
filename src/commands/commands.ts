// Telegram command definitions
// In Telegram, commands are simple strings that start with /

// Balance query command
export const balanceCommands = ['balance'];

// Gas estimation commands
export const gasCommands = ['gas-estimate', 'gas-price'];

// Event alert commands
export const alertCommands = ['alert-add', 'alert-list', 'alert-remove'];

// Push message command
export const pushCommands = ['push'];

// Export all commands
export const allCommands = [
  ...balanceCommands,
  ...gasCommands,
  ...alertCommands,
  ...pushCommands,
];
