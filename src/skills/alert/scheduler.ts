import cron from 'node-cron';
import { ethers } from 'ethers';
import { alerts } from './handler';
import { getEthBalance, getCurrentGasPrice } from '../../services/web3Service';
import { logger } from '../../utils/logger';

let cronJob: cron.ScheduledTask | null = null;

/**
 * Start alert monitoring service
 */
export function startAlertService() {
  const checkInterval = process.env.ALERT_CHECK_INTERVAL || '60'; // Default 60 seconds
  
  logger.info(`Starting alert service, check interval: ${checkInterval} seconds`);

  // Check alerts every minute
  cronJob = cron.schedule(`*/${checkInterval} * * * * *`, async () => {
    try {
      await checkAlerts();
    } catch (error) {
      logger.error('Alert check error:', error);
    }
  });
}

/**
 * Stop alert monitoring service
 */
export function stopAlertService() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info('Alert service stopped');
  }
}

/**
 * Check all alerts
 */
async function checkAlerts() {
  if (alerts.size === 0) {
    return;
  }

  logger.info(`Checking ${alerts.size} alerts...`);

  for (const [alertId, alert] of alerts) {
    try {
      switch (alert.type) {
        case 'balance':
          await checkBalanceAlert(alertId, alert);
          break;
        case 'gas':
          await checkGasAlert(alertId, alert);
          break;
        case 'custom':
          // Custom alerts don't need automatic checking
          break;
      }
    } catch (error) {
      logger.error(`Alert check failed (${alertId}):`, error);
    }
  }
}

/**
 * Check balance alert
 */
async function checkBalanceAlert(alertId: string, alert: any) {
  if (!alert.address || !alert.threshold) {
    return;
  }

  try {
    // Convert address to checksum format
    const checksumAddress = ethers.getAddress(alert.address.toLowerCase());
    const balance = await getEthBalance(checksumAddress);
    const balanceNum = parseFloat(balance);

    if (balanceNum >= alert.threshold) {
      await sendAlertNotification(
        alert.chatId,
        `💰 Balance alert triggered!\n\nAddress: \`${alert.address}\`\nCurrent Balance: ${balance} CSPR\nThreshold: ${alert.threshold} CSPR`
      );
      
      logger.info(`Balance alert triggered: ${alertId}`);
    }
  } catch (error) {
    logger.error(`Balance alert check failed (${alertId}):`, error);
  }
}

/**
 * Check Gas price alert
 */
async function checkGasAlert(alertId: string, alert: any) {
  if (!alert.threshold) {
    return;
  }

  try {
    const gasPrices = await getCurrentGasPrice();
    const gasPriceNum = parseFloat(gasPrices.gasPrice);

    if (gasPriceNum <= alert.threshold) {
      await sendAlertNotification(
        alert.chatId,
        `⛽ Gas price alert triggered!\n\nCurrent Gas Price: ${gasPrices.gasPrice}\nThreshold: ${alert.threshold} Gwei\nMax Fee: ${gasPrices.maxFeePerGas}\nPriority Fee: ${gasPrices.maxPriorityFeePerGas}`
      );
      
      logger.info(`Gas alert triggered: ${alertId}`);
    }
  } catch (error) {
    logger.error(`Gas alert check failed (${alertId}):`, error);
  }
}

/**
 * Send alert notification to chat
 */
async function sendAlertNotification(chatId: number, message: string) {
  try {
    // Note: This requires access to the Telegram bot instance
    // In production, you'd inject the bot or use an event emitter
    logger.info(`Would send alert to chat ${chatId}: ${message}`);
  } catch (error) {
    logger.error(`Failed to send alert notification (chat: ${chatId}):`, error);
  }
}
