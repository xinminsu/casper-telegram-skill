# Command Examples and Use Cases

## 💰 Balance Query Scenarios

### Query ETH Balance
```
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Query ETH Balance on Polygon Network
```
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb network:polygon
```

### Query USDT Token Balance
```
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb token:0xdAC17F958D2ee523a2206206994597C13D831ec7
```

### Query USDC Balance on Polygon
```
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb network:polygon token:0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
```

## ⛽ Gas Related Scenarios

### Query Current Ethereum Gas Price
```
/gas-price
```

### Query Polygon Gas Price
```
/gas-price network:polygon
```

### Estimate Transfer Gas Fees
```
/gas-estimate from:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb to:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 value:0.1
```

### Estimate Contract Interaction Gas
```
/gas-estimate from:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb to:0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D network:ethereum
```

## 🔔 Alert Setup Scenarios

### Set Up Large Balance Alert
Get notified when wallet balance exceeds 10 ETH:
```
/alert add type:balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb threshold:10
```

### Set Up Low Gas Price Alert
Get notified when Gas price drops below 20 Gwei:
```
/alert add type:gas threshold:20
```

### Set Up Custom Scheduled Alert
```
/alert add type:custom message:"Remember to check today's Gas price"
```

### View All Alerts
```
/alert list
```

### Delete Specific Alert
```
/alert remove id:alert_1234567890_abc123
```

## 📢 Message Push Scenarios

### Push System Notification
```
/push message:"⚠️ System Maintenance Notice: Routine maintenance scheduled tonight 22:00-23:00"
```

### Push Market Information
```
/push message:"📈 ETH price breaks through $2000, pay attention to risk management"
```

### Push to Specific Channel
```
/push message:"Important Announcement" channel:#announcements
```

## 🎯 Real-World Use Cases

### Case 1: Monitor Whale Wallets
```
# Set up monitoring for known whale address
/alert add type:balance address:0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503 threshold:1000

# Regularly query balance
/balance address:0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503
```

### Case 2: Optimize Transaction Timing with Gas
```
# First check current Gas
/gas-price

# Set up low Gas alert
/alert add type:gas threshold:15

# When alerted, estimate transaction cost
/gas-estimate from:YOUR_ADDRESS to:CONTRACT_ADDRESS value:1
```

### Case 3: Portfolio Tracking
```
# Query balances for multiple addresses
/balance address:0xAddress1
/balance address:0xAddress2 network:polygon
/balance address:0xAddress3 token:0xTokenAddress

# Set up balance change alerts
/alert add type:balance address:0xAddress1 threshold:5
```

### Case 4: Team Notification System
```
# Daily standup reminder
/push message:"🌅 Daily standup meeting starts in 10 minutes"

# Project update notification
/push message:"✅ v2.0 has been deployed to mainnet" channel:#updates

# Gas warning
/push message:"⚠️ Gas price too high (>50 Gwei), recommend delaying non-urgent transactions"
```

## 💡 Advanced Tips

### Common Token Contract Addresses

**Ethereum:**
- USDT: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- DAI: `0x6B175474e89094C44Da98b954EedeAC495271d0F`
- WETH: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`

**Polygon:**
- USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- USDT: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- WMATIC: `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270`

**BSC:**
- BUSD: `0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56`
- USDT: `0x55d398326f99059fF775485246999027B3197955`
- WBNB: `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`

### Batch Query Script Ideas

You can combine Discord's thread feature to create a batch query command flow:
1. User sends multiple addresses
2. Bot queries and replies sequentially
3. Finally summarize the results

### Monitoring Dashboard

Create dedicated channels for monitoring:
- Set up multiple balance alerts
- Set up Gas price alerts
- Regularly push market summaries

---

More creative uses waiting for you to discover! 🚀
