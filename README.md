# Casper Telegram Bot

A powerful Telegram Bot built with Skill-based architecture for blockchain queries, transaction execution, gas estimation, and event notifications on the Casper network.

## ✨ Features

### 📊 Balance Query
- Query ETH balance for any wallet address
- Query ERC20 token balances
- Real-time blockchain data from Casper network

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
- Push notification messages to chats
- Support custom message content

## 🏗️ Architecture

This project uses a modern **Skill-based architecture** where each feature is implemented as an independent skill module:

```
src/
├── core/              # Core framework
│   └── SkillManager.ts    # Manages skill lifecycle
├── skills/            # Modular skills
│   ├── balance/       # Balance query skill
│   ├── gas/           # Gas price & estimation skill
│   ├── alert/         # Event monitoring skill
│   └── push/          # Message push skill
├── services/          # Shared services
│   └── web3Service.ts # Blockchain interaction layer
└── utils/             # Utilities
    └── logger.ts      # Logging system
```

**Benefits:**
- ✅ **Modular**: Each skill is self-contained and independent
- ✅ **Extensible**: Easy to add new features without modifying existing code
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Testable**: Isolated modules for easy testing

## 🚀 Quick Start

### Prerequisites

1. **Clone the project**

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

# Casper Blockchain Configuration
CASPER_RPC_URL=https://rpc.casper.network
CASPER_CHAIN_ID=1

# Logging
LOG_LEVEL=info
```

4. **Get Discord Bot Token**

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

Query wallet ETH or token balance on Casper network.

**Parameters:**
- `address` (required): Wallet address
- `token` (optional): ERC20 token contract address

**Example:**
```
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb token:0xdAC17F958D2ee523a2206206994597C13D831ec7
```

### `/gas-price` - Query Gas Price

View current Casper network gas price information.

**Example:**
```
/gas-price
```

### `/gas-estimate` - Estimate Gas Fees

Estimate gas fees required for a transaction on Casper.

**Parameters:**
- `from` (required): Sender address
- `to` (required): Receiver address
- `value` (optional): Transfer amount (ETH), default 0

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

Push notification messages to chats.

**Parameters:**
- `message` (required): Message content to push

**Example:**
```
/push Important Notice: System maintenance scheduled tonight
```

## 🏗️ Project Structure

```
casper-telegram-skill/
├── src/
│   ├── core/               # Core framework
│   │   └── SkillManager.ts # Skill lifecycle manager
│   ├── skills/             # Modular skills
│   │   ├── types.ts        # Skill interfaces
│   │   ├── BaseSkill.ts    # Base skill class
│   │   ├── SkillRegistry.ts# Skill registry
│   │   ├── balance/        # Balance skill
│   │   ├── gas/            # Gas skill
│   │   ├── alert/          # Alert skill
│   │   └── push/           # Push skill
│   ├── services/           # Shared services
│   │   └── web3Service.ts  # Blockchain service layer
│   ├── utils/              # Utilities
│   │   └── logger.ts       # Logging utility
│   └── index.ts            # Entry point
├── docs/                   # Documentation
│   └── SKILL_DEVELOPMENT.md
├── logs/                   # Log files
├── .env.example            # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Tech Stack

## ⚙️ Configuration

### Discord Configuration

- `DISCORD_TOKEN`: Discord Bot authentication token
- `DISCORD_CLIENT_ID`: Discord application Client ID

### Blockchain Configuration

- `CASPER_RPC_URL`: Casper network RPC node
- `CASPER_CHAIN_ID`: Casper chain ID (default 1)

### Other Configuration

- `LOG_LEVEL`: Log level (debug/info/warn/error)
- `ALERT_CHECK_INTERVAL`: Alert check interval (seconds)

## 📝 Development Guide

### Adding New Skills

Creating a new skill is simple:

1. Create skill directory: `src/skills/my-skill/`
2. Extend BaseSkill class
3. Define commands and handlers
4. Register in `src/index.ts`

See [SKILL_DEVELOPMENT.md](docs/SKILL_DEVELOPMENT.md) for detailed guide.

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
   - Telegram API has rate limits, control request frequency
   - RPC nodes may also have request limits

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 📞 Contact

For questions or suggestions, please submit an Issue.

---

**Casper Telegram Bot** - Making blockchain interactions simpler 🚀
