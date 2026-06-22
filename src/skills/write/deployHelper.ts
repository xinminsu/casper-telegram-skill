import { parseExecutionResult, motesToCspr } from '../../services/casperTransactionService';

/**
 * Truncate a string for display
 */
function truncate(str: string, maxLen: number = 50): string {
  if (!str) return 'N/A';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

/**
 * Create a success markdown response for a deploy
 * Replaces Discord's createDeploySuccessEmbed - returns Markdown text for Telegram
 */
export function createDeploySuccessText(
  title: string,
  deployHash: string,
  result: any,
  extraFields?: { name: string; value: string; inline?: boolean }[]
): string {
  const parsed = parseExecutionResult(result);

  let text = `✅ *${title}*\n\n`;
  text += `*Deploy Hash:* \`${truncate(deployHash, 40)}\`\n`;
  text += `*Status:* ${parsed.success ? '✅ Success' : '❌ Failed'}\n`;
  text += `*Gas Consumed:* ${motesToCspr(parsed.cost)} CSPR\n`;

  if (parsed.errorMessage) {
    text += `*Error:* ${truncate(parsed.errorMessage, 200)}\n`;
  }

  if (parsed.transfers && parsed.transfers.length > 0) {
    text += `*Transfers:* ${parsed.transfers.length} transfer(s) executed\n`;
  }

  if (extraFields) {
    for (const field of extraFields) {
      text += `*${field.name}:* ${field.value}\n`;
    }
  }

  text += `\n_Casper Telegram Bot - Write Operation_`;
  return text;
}

/**
 * Create a pending markdown response (deploy submitted, waiting for confirmation)
 * Replaces Discord's createDeployPendingEmbed
 */
export function createDeployPendingText(
  title: string,
  deployHash: string
): string {
  let text = `⏳ *${title}*\n\n`;
  text += `*Deploy Hash:* \`${truncate(deployHash, 40)}\`\n`;
  text += `*Status:* Submitted - waiting for confirmation...\n`;
  return text;
}

/**
 * Check if signing key is configured and return error message if not
 */
export function checkSigningKey(): string | null {
  const pemKey = process.env.CASPER_SIGNING_KEY_PEM;
  const hexKey = process.env.CASPER_SIGNING_KEY_HEX;

  if (!pemKey && !hexKey) {
    return (
      '❌ No signing key configured.\n\n' +
      'To enable write operations, set one of the following in your `.env` file:\n' +
      '`CASPER_SIGNING_KEY_HEX=<your_private_key_hex>`\n' +
      '`CASPER_SIGNING_KEY_PEM=<your_private_key_pem>`\n\n' +
      'Generate a key pair with: `npx casper-client keygen -a ed25519`'
    );
  }

  return null;
}
