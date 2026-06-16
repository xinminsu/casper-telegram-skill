# Pharos Discord Skill - Project Architecture Document

## 📋 Project Overview

Pharos Discord Skill is a fully functional blockchain Discord Bot that provides balance queries, gas estimation, transaction execution, and event notifications.

## 🏗️ Architecture Design

### Overall Architecture

```
┌─────────────────────────────────────┐
│         Discord Users               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Discord API Gateway            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Pharos Discord Bot            │
│  ┌──────────────────────────────┐   │
│  │   Command Router             │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────▼───────────────────┐   │
│  │   Command Handlers           │   │
│  │  - Balance Handler           │   │
│  │  - Gas Estimate Handler      │   │
│  │  - Gas Price Handler         │   │
│  │  - Alert Handler             │   │
│  │  - Push Handler              │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────▼───────────────────┐   │
│  │   Services Layer             │   │
│  │  - Web3 Service              │   │
│  │  - Alert Service             │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────▼───────────────────┐   │
│  │   External Integrations      │   │
│  │  - Blockchain RPC            │   │
│  │  - Discord Channels          │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 📁 Directory Structure Details

```
pharos-discord-skill/
│
├── src/                          # Source code directory
│   ├── index.ts                  # Application entry point
│   │   - Initialize Discord Client
│   │   - Register commands
│   │   - Start services
│   │
│   ├── commands/                 # Command definition layer
│   │   ├── commands.ts           # All Slash Commands definitions
│   │   │   - balanceCommand
│   │   │   - gasEstimateCommand
│   │   │   - gasPriceCommand
│   │   │   - alertCommand
│   │   │   - pushCommand
│   │   ├── register.ts           # Command registration logic
│   │   └── index.ts              # Export module
│   │
│   ├── handlers/                 # Command handling layer
│   │   ├── interactionHandler.ts # Interaction routing dispatcher
│   │   ├── balanceHandler.ts     # Balance query handler
│   │   ├── gasEstimateHandler.ts # Gas estimation handler
│   │   ├── gasPriceHandler.ts    # Gas price query handler
│   │   ├── alertHandler.ts       # Alert management handler
│   │   ├── pushHandler.ts        # Message push handler
│   │   └── index.ts              # Export module
│   │
│   ├── services/                 # Business logic layer
│   │   ├── web3Service.ts        # Web3 blockchain service
│   │   │   - getEthBalance()
│   │   │   - getTokenBalance()
│   │   │   - estimateGas()
│   │   │   - getCurrentGasPrice()
│   │   │   - sendTransaction()
│   │   └── alertService.ts       # Alert monitoring service
│   │       - startAlertService()
│   │       - checkAlerts()
│   │       - checkBalanceAlert()
│   │       - checkGasAlert()
│   │
│   └── utils/                    # Utility layer
│       └── logger.ts             # Logging utility (Winston)
│
├── logs/                         # Log files directory
│   ├── error.log                 # Error logs
│   └── combined.log              # All logs
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore configuration
├── package.json                  # Project dependencies configuration
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Main documentation
├── QUICKSTART.md                 # Quick start guide
├── EXAMPLES.md                   # Usage examples
└── ARCHITECTURE.md               # Architecture document (this file)
```

## 🔧 Tech Stack Description

### Core Dependencies

| Library | Version | Purpose |
|----|------|------|
| discord.js | ^14.14.1 | Discord Bot framework, handles interactions and messages |
| ethers | ^6.11.1 | Ethereum interaction library, connects to blockchain |
| winston | ^3.11.0 | Logging framework |
| node-cron | ^3.0.3 | Scheduled task scheduling |
| dotenv | ^16.4.1 | Environment variable management |

### Development Dependencies

| Library | Version | Purpose |
|----|------|------|
| typescript | ^5.3.3 | TypeScript compiler |
| ts-node | ^10.9.2 | TypeScript runtime |
| @types/node | ^20.11.5 | Node.js type definitions |

## 🔄 Data Flow

### 1. Command Execution Flow

```
User enters command
    ↓
Discord Gateway receives
    ↓
Bot receives interactionCreate event
    ↓
interactionHandler routes and dispatches
    ↓
Corresponding Handler processes business logic
    ↓
Calls Web3 Service to fetch on-chain data
    ↓
Formats response (Embed)
    ↓
Sends back to Discord channel
```

### 2. Alert Monitoring Flow

```
Bot starts
    ↓
startAlertService() starts scheduled tasks
    ↓
Checks all alerts every N seconds
    ↓
Executes checks based on alert type
    ├─ Balance Alert: Query balance → Compare threshold
    ├─ Gas Alert: Query Gas → Compare threshold
    └─ Custom Alert: Skip automatic check
    ↓
Trigger conditions met
    ↓
Send notification to specified channel
```

## 🎯 Core Module Details

### 1. Web3 Service (`src/services/web3Service.ts`)

**Responsibility**: Encapsulates all blockchain interaction logic

**Main Functions**:
- `getProvider(network)`: Get Provider for specified network
- `getEthBalance(address, network)`: Query ETH balance
- `getTokenBalance(tokenAddress, walletAddress, network)`: Query ERC20 token balance
- `estimateGas(from, to, value, data, network)`: Estimate transaction Gas
- `getCurrentGasPrice(network)`: Get current Gas price
- `sendTransaction(privateKey, to, value, network)`: Send transaction

**Design Points**:
- Multi-chain support (Ethereum, Polygon, BSC)
- Unified Provider management
- Error handling and formatting

### 2. Alert Service (`src/services/alertService.ts`)

**Responsibility**: Manage and monitor blockchain event alerts

**Main Functions**:
- `startAlertService()`: Start scheduled monitoring tasks
- `checkAlerts()`: Iterate through all alerts and check
- `checkBalanceAlert()`: Check balance alerts
- `checkGasAlert()`: Check Gas price alerts
- `sendAlertNotification()`: Send alert notifications

**Design Points**:
- Use node-cron for scheduled task execution
- In-memory storage for alert data (production should use database)
- Asynchronous parallel checking for efficiency

### 3. Command Handlers (`src/handlers/*.ts`)

**Responsibility**: Handle user command interactions

**Common Pattern**:
1. `deferReply()` - Defer reply (avoid timeout)
2. Validate parameter format
3. Call Service layer to fetch data
4. Build Embed response
5. `editReply()` - Send formatted response
6. Log the action

**Error Handling**:
- Parameter validation failure → Return friendly error message
- Service call failure → Catch exception and notify user
- Log detailed error information for debugging

### 4. Commands Definition (`src/commands/commands.ts`)

**Responsibility**: Define structure of all Slash Commands

**Command Types**:
- **Basic commands**: balance, gas-price
- **Complex commands**: gas-estimate (multiple parameters)
- **Subcommands**: alert add/list/remove

**Design Points**:
- Build using SlashCommandBuilder
- Set required/optional parameters
- Add parameter descriptions and options
- Provide Choices to restrict input

## 🔐 Security Considerations

### Sensitive Information Management

- ✅ Use `.env` file to store secrets
- ✅ `.gitignore` excludes `.env`
- ❌ Do not hardcode private keys in code
- ⚠️ Use key management services in production

### Transaction Security

- ⚠️ Current `sendTransaction` is for demonstration only
- ⚠️ Production environment requires:
  - Secure private key storage (HSM, key vault)
  - Transaction signature confirmation mechanism
  - Double verification for amount and address
  - Transaction limit control

### Input Validation

- ✅ Wallet address format validation (regular expression)
- ✅ Parameter type checking
- ✅ Network whitelist restrictions

## 📊 Performance Optimization

### Current Optimizations

- Use `Promise.all` for parallel token information queries
- Configurable check interval for scheduled tasks
- Log level分级 reduces unnecessary I/O

### Scalable Optimizations

1. **Caching Mechanism**: Cache Gas prices, token metadata
2. **Database**: Use Redis/MongoDB to store alerts and user data
3. **Queue System**: Use Bull/RabbitMQ to handle large volumes of requests
4. **Load Balancing**: Multi-instance deployment + reverse proxy
5. **RPC Optimization**: Use multiple RPC nodes for load balancing

## 🚀 Deployment Options

### Development Environment

```bash
npm run dev  # Run directly with ts-node
```

### Production Environment

```bash
npm run build  # Compile to JavaScript
pm2 start dist/index.js --name pharos-bot  # Manage with PM2
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY .env ./.env
CMD ["node", "dist/index.js"]
```

## 🧪 Testing Strategy

### Unit Tests (To be implemented)

- Web3 Service function tests
- Address format validation tests
- Embed building tests

### Integration Tests (To be implemented)

- Complete command execution flow
- Alert trigger tests
- Error handling tests

### Manual Testing Checklist

- [ ] All commands respond normally
- [ ] Invalid parameters show correct prompts
- [ ] Alerts trigger on time
- [ ] Logs record correctly
- [ ] Errors handled gracefully

## 📈 Monitoring and Maintenance

### Log Monitoring

- Check `logs/error.log` for errors
- Check `logs/combined.log` for operational status
- Regularly clean log files to avoid excessive size

### Health Checks

- Bot online status
- RPC connection status
- Alert service running status
- Memory usage

### Common Troubleshooting

1. **Commands not responding**: Check Bot permissions and network connection
2. **Query failures**: Check if RPC URL is available
3. **Alerts not triggering**: Check scheduled tasks and threshold settings
4. **Memory leaks**: Restart Bot and check alerts Map size

## 🔮 Future Expansion Directions

### Feature Extensions

- [ ] Support more blockchain networks (Arbitrum, Optimism, Avalanche)
- [ ] NFT balance queries
- [ ] DeFi protocol interactions (Uniswap, Aave)
- [ ] Price oracle integration
- [ ] Transaction history queries
- [ ] Charts and data visualization

### Technical Improvements

- [ ] Database persistence (PostgreSQL/MongoDB)
- [ ] Redis caching layer
- [ ] WebSocket real-time push
- [ ] GraphQL API
- [ ] Microservices architecture split
- [ ] Complete unit test coverage

### User Experience

- [ ] Multi-language support
- [ ] Custom themes and styles
- [ ] Interactive menus and buttons
- [ ] Command auto-completion optimization
- [ ] Usage statistics and analytics

---

**Last Updated**: 2026-06-16
**Version**: 1.0.0
