import cron from 'node-cron';
import { alerts } from '../handlers/alertHandler';
import { getEthBalance, getCurrentGasPrice } from '../services/web3Service';
import { client } from '../index';
import { logger } from '../utils/logger';

/**
 * Start alert monitoring service
 */
export function startAlertService() {
  const checkInterval = process.env.ALERT_CHECK_INTERVAL || '60'; // Default 60 seconds
  
  logger.info(`Starting alert service, check interval: ${checkInterval} seconds`);

  // Check alerts every minute
  cron.schedule(`*/${checkInterval} * * * * *`, async () => {
    try {
      await checkAlerts();
    } catch (error) {
      logger.error('Alert check error:', error);
    }
  });
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
    const balance = await getEthBalance(alert.address);
    const balanceNum = parseFloat(balance);

    if (balanceNum >= alert.threshold) {
      await sendAlertNotification(
        alert.channelId,
        `💰 Balance alert triggered!\n\nAddress: \`${alert.address}\`\nCurrent Balance: ${balance} ETH\nThreshold: ${alert.threshold} ETH`
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
        alert.channelId,
        `⛽ Gas price alert triggered!\n\nCurrent Gas Price: ${gasPrices.gasPrice}\nThreshold: ${alert.threshold} Gwei\nMax Fee: ${gasPrices.maxFeePerGas}\nPriority Fee: ${gasPrices.maxPriorityFeePerGas}`
      );
      
      logger.info(`Gas alert triggered: ${alertId}`);
    }
  } catch (error) {
    logger.error(`Gas alert check failed (${alertId}):`, error);
  }
}

/**
 * Send alert notification to channel
 */
async function sendAlertNotification(channelId: string, message: string) {
  try {
    const channel = await client.channels.fetch(channelId);
    
    if (channel && 'send' in channel) {
      await channel.send({
        content: `🔔 **Pharos Alert**\n\n${message}`,
      });
    }
  } catch (error) {
    logger.error(`Failed to send alert notification (channel: ${channelId}):`, error);
  }
}
