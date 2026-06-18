# Casper Telegram Bot - Architecture Documentation

## Overview

Casper Telegram Bot is built using a modern **Skill-based architecture** that provides modularity, extensibility, and maintainability. Each feature is implemented as an independent skill module managed by a central SkillManager.

---

## Architecture Design

### High-Level Structure

```
┌─────────────────────────────────────┐
│       Telegram Bot Core             │
│  - Event Loop                       │
│  - Command Router                   │
│  - Error Handler                    │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│       Skill Manager                 │
│  - Initialize Skills                │
│  - Register Commands                │
│  - Route Interactions               │
│  - Manage Lifecycle                 │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┬──────────┐
    ▼             ▼          ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Balance│  │  Gas   │  │ Alert  │
│ Skill  │  │ Skill  │  │ Skill  │
└────────┘  └────────┘  └────────┘
    │             │          │
    └─────────────┴──────────┘
                  │
                  ▼
        ┌─────────────────┐
        │ Shared Services │
        │ - Web3Service   │
        │ - Logger        │
        └─────────────────┘
```

---

## Core Components

### 1. SkillManager (`src/core/SkillManager.ts`)

The central orchestrator that manages all skills in the application.

**Responsibilities:**
- Initialize and register all skills
- Route commands to appropriate skills
- Manage skill lifecycle (init/destroy)
- Provide graceful shutdown

**Key Methods:**
```typescript
class SkillManager {
  async initialize(): Promise<void>
  async registerSkill(skill: Skill): Promise<void>
  async handleCommand(interaction): Promise<void>
  async shutdown(): Promise<void>
}
```

### 2. Skill Interface (`src/skills/types.ts`)

All skills must implement this interface to ensure consistency.

```typescript
interface Skill {
  name: string
  version: string
  description: string
  commands: SlashCommandBuilder[]
  
  initialize(): Promise<void>
  handleCommand(interaction): Promise<void>
  destroy(): Promise<void>
  getMetadata(): SkillMetadata
}
```

### 3. BaseSkill (`src/skills/BaseSkill.ts`)

Abstract base class that provides common functionality for all skills.

**Features:**
- Lifecycle management (initialize/destroy)
- Metadata tracking
- Initialization state checking
- Template method pattern for command handling

**Usage:**
```typescript
class MySkill extends BaseSkill {
  constructor() {
    super({
      name: 'my-skill',
      version: '1.0.0',
      description: 'My custom skill',
      commands: [myCommand]
    })
  }
  
  async handleCommand(interaction) {
    // Custom logic here
  }
}
```

### 4. SkillRegistry (`src/skills/SkillRegistry.ts`)

Manages registration and retrieval of skills.

**Features:**
- Register/unregister skills
- Query skills by name
- List all registered skills
- Prevent duplicate registrations

---

## Skill Modules

Each skill is a self-contained module with the following structure:

```
src/skills/{skill-name}/
├── {SkillName}Skill.ts   # Main skill class
├── commands.ts            # Command definitions
├── handler.ts             # Command handler logic
└── index.ts               # Export
```

### Available Skills

#### 1. Balance Skill (`src/skills/balance/`)
**Purpose**: Query wallet balances on Casper network

**Commands:**
- `/balance` - Query ETH or token balance

**Features:**
- ETH balance queries
- ERC20 token balance queries
- Formatted embed responses

#### 2. Gas Skill (`src/skills/gas/`)
**Purpose**: Gas price queries and transaction estimation

**Commands:**
- `/gas-price` - Current gas prices
- `/gas-estimate` - Estimate transaction fees

**Features:**
- Real-time gas price data
- Transaction cost estimation
- Detailed gas breakdown

#### 3. Alert Skill (`src/skills/alert/`)
**Purpose**: Blockchain event monitoring and notifications

**Commands:**
- `/alert add` - Create new alert
- `/alert list` - View all alerts
- `/alert remove` - Delete alert

**Features:**
- Balance change monitoring
- Gas price threshold alerts
- Custom message alerts
- Cron-based scheduling
- In-memory storage

#### 4. Push Skill (`src/skills/push/`)
**Purpose**: Push notification messages to chats

**Commands:**
- `/push` - Send message to chat

**Features:**
- Formatted notifications
- Logging support

---

## Shared Services

### Web3Service (`src/services/web3Service.ts`)

Provides blockchain interaction layer for all skills.

**Functions:**
```typescript
// Balance queries
getEthBalance(address): Promise<string>
getTokenBalance(tokenAddress, walletAddress): Promise<string>

// Gas operations
getCurrentGasPrice(): Promise<GasPrices>
estimateGas(from, to, value): Promise<GasEstimate>
```

**Configuration:**
- Single-chain focus: Casper network only
- RPC URL from environment: `CASPER_RPC_URL`
- ethers.js v6 for blockchain interactions

### Logger (`src/utils/logger.ts`)

Winston-based logging system.

**Log Levels:**
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages
- `debug`: Debug-level messages

**Output:**
- Console output
- File rotation (logs/error.log, logs/combined.log)

---

## Data Flow

### Command Execution Flow

```
User enters /balance command
         │
         ▼
Telegram sends message to bot
         │
         ▼
Bot receives message event
         │
         ▼
SkillManager.handleCommand() called
         │
         ▼
SkillManager finds matching skill
         │
         ▼
BalanceSkill.handleCommand() executed
         │
         ▼
Handler validates input
         │
         ▼
Web3Service queries blockchain
         │
         ▼
Response sent to Telegram
```

### Alert Monitoring Flow

```
AlertSkill.initialize() called
         │
         ▼
startAlertService() starts cron job
         │
         ▼
Cron checks alerts every N seconds
         │
         ▼
For each alert:
  ├─ Query current balance/gas
  ├─ Compare with threshold
  └─ Send notification if triggered
```

---

## Configuration

### Environment Variables

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token

# Casper Blockchain Configuration
CASPER_RPC_URL=https://rpc.casper.network
CASPER_CHAIN_ID=1

# Application Configuration
LOG_LEVEL=info
ALERT_CHECK_INTERVAL=60
```

### Skill Configuration

Skills can be configured through:
1. Environment variables
2. Constructor parameters
3. Configuration files (future enhancement)

---

## Extensibility

### Adding New Skills

Creating a new skill is straightforward:

**Step 1**: Create skill directory
```bash
mkdir -p src/skills/my-skill
```

**Step 2**: Define commands
```typescript
// src/skills/my-skill/commands.ts
export const myCommand = new SlashCommandBuilder()
  .setName('my-command')
  .setDescription('My custom command')
```

**Step 3**: Create handler
```typescript
// src/skills/my-skill/handler.ts
export async function handleMyCommand(interaction) {
  await interaction.reply('Hello!')
}
```

**Step 4**: Implement skill
```typescript
// src/skills/my-skill/MySkill.ts
export class MySkill extends BaseSkill {
  constructor() {
    super({
      name: 'my-skill',
      version: '1.0.0',
      description: 'My custom skill',
      commands: [myCommand]
    })
  }
  
  async handleCommand(interaction) {
    await handleMyCommand(interaction)
  }
}
```

**Step 5**: Register in index.ts
```typescript
await skillManager.registerSkill(new MySkill())
```

### Plugin System (Future)

Planned features:
- Dynamic skill loading from `plugins/` directory
- npm package-based skill distribution
- Hot-reload support
- Skill dependency management

---

## Error Handling

### Strategy

1. **Input Validation**: Validate all user inputs before processing
2. **Graceful Degradation**: Continue operation even if one skill fails
3. **Comprehensive Logging**: Log all errors with context
4. **User-Friendly Messages**: Show clear error messages to users

### Example

```typescript
try {
  const balance = await getEthBalance(address)
  await interaction.reply(`Balance: ${balance}`)
} catch (error) {
  logger.error('Balance query failed:', error)
  await interaction.reply('❌ Failed to query balance. Please try again.')
}
```

---

## Testing Strategy

### Unit Testing (Planned)

Test individual components:
- Skill initialization
- Command validation
- Service functions
- Utility functions

### Integration Testing (Planned)

Test component interactions:
- SkillManager + Skills
- Skills + Web3Service
- Alert scheduler + notifications

### Manual Testing

Current testing approach:
1. Run bot in development mode
2. Test commands in Telegram
3. Monitor logs for errors
4. Verify blockchain interactions

---

## Performance Considerations

### Optimizations

1. **Lazy Loading**: Skills loaded on startup, not per-request
2. **Connection Pooling**: Single RPC provider instance reused
3. **Memory Management**: Alerts stored in memory with cleanup
4. **Async Operations**: All I/O operations are non-blocking

### Future Enhancements

- Redis caching for balance queries
- Rate limiting for RPC calls
- Database persistence for alerts
- Connection pooling improvements

---

## Security

### Best Practices

1. **Environment Variables**: Sensitive data never hardcoded
2. **Input Validation**: All user inputs validated before use
3. **Address Verification**: Wallet addresses verified format
4. **No Private Keys**: Bot doesn't store or use private keys

### Recommendations

- Use `.gitignore` to exclude `.env` file
- Rotate Telegram bot tokens regularly
- Use secure RPC endpoints (HTTPS)
- Monitor logs for suspicious activity

---

## Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
pm2 start dist/index.js --name casper-bot
pm2 save
```

### Environment Setup

1. Set up Node.js 18+ environment
2. Install dependencies: `npm install`
3. Configure `.env` file
4. Build project: `npm run build`
5. Start with process manager (PM2)

---

## Monitoring & Observability

### Logging

- All operations logged with appropriate levels
- Error logs include stack traces
- Request/response logging for debugging

### Metrics (Future)

- Command usage statistics
- Response time tracking
- Error rate monitoring
- Skill performance metrics

---

## Version History

### v2.0.0 (Current)
- Skill-based architecture
- Modular design
- Casper-only blockchain support
- Complete English localization

### v1.0.0 (Legacy)
- Monolithic architecture
- Multi-chain support
- Scattered handler structure

---

## Contributing

### Code Standards

- TypeScript for type safety
- ESLint for code style
- JSDoc comments for public APIs
- Consistent naming conventions

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Implement changes
4. Add tests (when available)
5. Update documentation
6. Submit pull request

---

## Future Roadmap

### Short Term
- [ ] Add unit tests
- [ ] Implement database storage
- [ ] Add more blockchain queries
- [ ] Improve error messages

### Medium Term
- [ ] Plugin system implementation
- [ ] Hot-reload support
- [ ] Performance optimization
- [ ] Monitoring dashboard

### Long Term
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Community plugin marketplace
- [ ] WebSocket real-time updates

---

**Last Updated**: 2026-06-18  
**Version**: 2.0.0  
**Architecture**: Skill-Based
