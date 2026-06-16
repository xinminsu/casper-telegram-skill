# Pharos Discord Bot Quick Start Guide

## 🚀 5-Minute Quick Start

### Step 1: Create Discord Bot

1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and enter application name (e.g., "Pharos Bot")
3. Select "Bot" from the left menu
4. Click "Add Bot" → "Yes, do it!"
5. In the "Token" section, click "Reset Token" → "Copy" and save this Token

### Step 2: Get Client ID

1. Select "OAuth2" → "General" from the left menu
2. Copy "Client ID"

### Step 3: Invite Bot to Your Server

Use the following link (replace YOUR_CLIENT_ID):
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Select your server and authorize.

### Step 4: Configure Project

1. **Copy environment variables file**
```bash
cp .env.example .env
```

2. **Edit .env file**
```env
DISCORD_TOKEN=The Bot Token you just copied
DISCORD_CLIENT_ID=The Client ID you just copied

# You can use free public RPC
ETH_RPC_URL=https://eth.llamarpc.com
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.bnbchain.org
```

### Step 5: Install and Run

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

When you see "Pharos Bot logged in successfully!", it means success!

## 📱 Test Commands

Enter in Discord:

```
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
/gas-price
/gas-estimate from:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb to:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

## 🔧 FAQ

### Q: Commands not showing up?
A: Wait a few minutes for Discord to sync commands, or re-invite the Bot.

### Q: Getting "Invalid wallet address" error?
A: Make sure the address format is correct, starts with 0x and is 42 characters long.

### Q: Query failed?
A: Check if the RPC URL is available, try switching to another RPC node.

### Q: How to stop the Bot?
A: Press `Ctrl + C` in the terminal

## 💡 Advanced Configuration

### Using Infura RPC (More Stable)

1. Register at [Infura](https://infura.io/)
2. Create a new project
3. Copy the Endpoint URL
4. Update `ETH_RPC_URL` in `.env`

### Production Deployment

```bash
# Build the project
npm run build

# Use PM2 to manage process
npm install -g pm2
pm2 start dist/index.js --name pharos-bot
pm2 save
pm2 startup
```

## 📊 Available Commands Quick Reference

| Command | Description | Example |
|------|------|------|
| `/balance` | Query balance | `/balance address:0x...` |
| `/gas-price` | Query Gas price | `/gas-price network:ethereum` |
| `/gas-estimate` | Estimate Gas | `/gas-estimate from:0x... to:0x...` |
| `/alert add` | Add alert | `/alert add type:balance address:0x...` |
| `/alert list` | List alerts | `/alert list` |
| `/alert remove` | Remove alert | `/alert remove id:alert_xxx` |
| `/push` | Push message | `/push message:"Notification content"` |

## 🆘 Need Help?

- View full documentation: [README.md](README.md)
- Submit Issue: GitHub Issues
- Check logs: `logs/combined.log`

---

Enjoy using! 🎉
