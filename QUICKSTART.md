# Casper Telegram Bot Quick Start Guide

## 🚀 5-Minute Quick Start

### Step 1: Create Telegram Bot

1. Open Telegram and search for @BotFather
2. Send the command `/newbot`
3. Follow the prompts to set your bot name (e.g., "Casper Bot")
4. Set a username for your bot (must end with 'bot', e.g., "casper_helper_bot")
5. Copy the Bot Token that BotFather provides

### Step 2: Configure Project

1. **Copy environment variables file**
```bash
cp .env.example .env
```

2. **Edit .env file**
```env
TELEGRAM_BOT_TOKEN=Your_Bot_Token_From_BotFather

# Casper RPC Configuration
CASPER_RPC_URL=https://rpc.casper.network
CASPER_CHAIN_ID=1
```

### Step 3: Install and Run

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

When you see "Casper Telegram Bot is online!", it means success!

## 📱 Test Commands

Start a chat with your bot in Telegram and use these commands:

```
/start
/help
/balance 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
/gas-price
/gas-estimate 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

## 🔧 FAQ

**Q: Commands not working?**  
A: Make sure you're using the correct command format. Use `/help` to see available commands.

**Q: Getting "Invalid wallet address" error?**  
A: Make sure the address format is correct, starts with 0x and is 42 characters long.

**Q: Query failed?**  
A: Check if the Casper RPC URL is available and accessible.

**Q: How to stop the Bot?**  
A: Press `Ctrl + C` in the terminal

## 💡 Advanced Configuration

### Production Deployment

```bash
# Build the project
npm run build

# Use PM2 to manage process
npm install -g pm2
pm2 start dist/index.js --name casper-bot
pm2 save
pm2 startup
```

## 📊 Available Commands Quick Reference

| Command | Description | Example |
|------|------|------|
| `/start` | Start the bot | `/start` |
| `/help` | Show help | `/help` |
| `/balance` | Query balance | `/balance 0x...` |
| `/gas-price` | Query Gas price | `/gas-price` |
| `/gas-estimate` | Estimate Gas | `/gas-estimate 0x... 0x...` |
| `/alert-add` | Add alert | `/alert-add balance 0x...` |
| `/alert-list` | List alerts | `/alert-list` |
| `/alert-remove` | Remove alert | `/alert-remove alert_xxx` |
| `/push` | Push message | `/push Notification content` |

## 🆘 Need Help?

- View full documentation: [README.md](README.md)
- Submit Issue: GitHub Issues
- Check logs: `logs/combined.log`

---

Enjoy using! 🎉
