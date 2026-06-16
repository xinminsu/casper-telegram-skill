# Pharos Discord Skill

A powerful Discord Bot that provides blockchain queries, transaction execution, gas estimation, and event notifications.

## ✨ Features

### 📊 Balance Query
- Query ETH balance for any wallet address
- Query ERC20 token balances
- Multi-chain support: Ethereum, Polygon, BSC

### ⛽ Gas Related
- Real-time gas price queries
- Estimate transaction gas fees
- Display detailed gas parameters (Gas Limit, Max Fee, Priority Fee)

### 🔔 Event Notifications
- Set up balance change alerts
- Gas price monitoring alerts
- Custom message alerts
- Manage alert lists (add, view, delete)

### 📢 Message Push
- Push notification messages to specified channels
- Support custom message content

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- Discord Bot Token
- Blockchain RPC node URL (e.g., Infura, Alchemy)

### Installation Steps

1. **Clone the project**
```bash
cd pharos-discord-skill
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit the `.env` file and fill in your configuration:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Blockchain Configuration
ETH_RPC_URL=https://mainnet.infura.io/v3/your_infura_key
ETH_CHAIN_ID=1

# Optional: Additional RPC endpoints for other chains
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.bnbchain.org

# Logging
LOG_LEVEL=info
```

4. **Get Discord Bot Token**

   a. Visit [Discord Developer Portal](https://discord.com/developers/applications)
   
   b. Create a new application
   
   c. Go to "Bot" page, create bot and copy Token
   
   d. Go to "OAuth2" page and copy Client ID
   
   e. Invite bot to your server with the following permissions:
   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
   ```

5. **Run the project**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## 📖 Command Usage Guide

### `/balance` - Query Balance

Query wallet ETH or token balance.

**Parameters:**
- `address` (required): Wallet address
- `network` (optional): Blockchain network (ethereum/polygon/bsc), default ethereum
- `token` (optional): ERC20 token contract address

**Example:**
```
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb network:ethereum token:0xdAC17F958D2ee523a2206206994597C13D831ec7
```

### `/gas-price` - Query Gas Price

View current network gas price information.

**Parameters:**
- `network` (optional): Blockchain network, default ethereum

**Example:**
```
/gas-price
/gas-price network:polygon
```

### `/gas-estimate` - Estimate Gas Fees

Estimate gas fees required for a transaction.

**Parameters:**
- `from` (required): Sender address
- `to` (required): Receiver address
- `value` (optional): Transfer amount (ETH), default 0
- `network` (optional): Blockchain network, default ethereum

**Example:**
```
/gas-estimate from:0xSender... to:0xReceiver... value:0.1
```

### `/alert` - Manage Alerts

Set up and manage blockchain event notifications.

**Subcommands:**

#### `/alert add` - Add Alert
- `type` (required): Alert type (balance/gas/custom)
- `address` (optional): Monitored wallet address
- `threshold` (optional): Trigger threshold
- `message` (optional): Custom message

**Example:**
```
/alert add type:balance address:0x742d... threshold:1.5
/alert add type:custom message:"Daily Gas Price Report"
```

#### `/alert list` - List All Alerts

**Example:**
```
/alert list
```

#### `/alert remove` - Remove Alert
- `id` (required): Alert ID

**Example:**
```
/alert remove id:alert_1234567890_abc123
```

### `/push` - Push Message

Push notification messages to channels.

**Parameters:**
- `message` (required): Message content to push
- `channel` (optional): Target channel, default current channel

**Example:**
```
/push message:"Important Notice: System maintenance scheduled tonight"
```

## 🏗️ Project Structure

```
pharos-discord-skill/
├── src/
│   ├── commands/           # Discord command definitions
│   │   ├── commands.ts     # All commands
│   │   ├── register.ts     # Command registration
│   │   └── index.ts
│   ├── handlers/           # Command handlers
│   │   ├── interactionHandler.ts
│   │   ├── balanceHandler.ts
│   │   ├── gasEstimateHandler.ts
│   │   ├── gasPriceHandler.ts
│   │   ├── alertHandler.ts
│   │   └── pushHandler.ts
│   ├── services/           # Business logic services
│   │   └── web3Service.ts  # Web3 related functions
│   ├── utils/              # Utility functions
│   │   └── logger.ts       # Logging utility
│   └── index.ts            # Entry point
├── logs/                   # Log files directory
├── .env.example            # Environment variables example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Tech Stack

- **TypeScript**: Type-safe JavaScript
- **discord.js v14**: Discord Bot framework
- **ethers.js v6**: Ethereum interaction library
- **winston**: Logging
- **node-cron**: Scheduled tasks (for alert checking)
- **dotenv**: Environment variable management

## ⚙️ Configuration

### Discord Configuration

- `DISCORD_TOKEN`: Discord Bot authentication token
- `DISCORD_CLIENT_ID`: Discord application Client ID

### Blockchain Configuration

- `ETH_RPC_URL`: Ethereum mainnet RPC node
- `POLYGON_RPC_URL`: Polygon network RPC node
- `BSC_RPC_URL`: BSC network RPC node
- `ETH_CHAIN_ID`: Chain ID (default 1)

### Other Configuration

- `LOG_LEVEL`: Log level (debug/info/warn/error)
- `ALERT_CHECK_INTERVAL`: Alert check interval (seconds)

## 📝 Development Guide

### Adding New Commands

1. Define the command in `src/commands/commands.ts`
2. Create corresponding handler file (e.g., `src/handlers/xxxHandler.ts`)
3. Register command route in `src/handlers/interactionHandler.ts`

### Viewing Logs

Log files are saved in `logs/` directory:
- `logs/error.log`: Error logs
- `logs/combined.log`: All logs

## ⚠️ Important Notes

1. **Security**: 
   - Never commit `.env` file to version control
   - Do not hardcode private keys or sensitive information in code
   - Use key management services in production

2. **Transaction Execution**: 
   - Current transaction execution is for demonstration only
   - Production environment requires complete signing and broadcasting process
   - Recommend integrating wallet connection features (e.g., MetaMask)

3. **Data Storage**: 
   - Currently using in-memory storage for alerts
   - Production should use databases (e.g., MongoDB, PostgreSQL)

4. **Rate Limiting**: 
   - Discord API has rate limits, control request frequency
   - RPC nodes may also have request limits

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 📞 Contact

For questions or suggestions, please submit an Issue.

---

**Pharos Discord Bot** - Making blockchain interactions simpler 🚀
