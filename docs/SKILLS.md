# Available Skills

This document lists all available skills in Casper Telegram Bot.

---

## 📊 Balance Skill

**Location**: `src/skills/balance/`  
**Version**: 1.0.0

### Description
Query wallet balances on the Casper blockchain network.

### Commands

#### `/balance`
Query ETH or token balance for a wallet address.

**Parameters:**
- `address` (required): Wallet address to query
- `token` (optional): ERC20 token contract address

**Examples:**
```
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
/balance address:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb token:0xdAC17F958D2ee523a2206206994597C13D831ec7
```

**Response Format:**
```
💰 Casper ETH Balance
├─ Wallet Address: 0x742d...
├─ Balance: 12.345 ETH
└─ Network: Casper
```

---

## ⛽ Gas Skill

**Location**: `src/skills/gas/`  
**Version**: 1.0.0

### Description
Query gas prices and estimate transaction fees on Casper network.

### Commands

#### `/gas-price`
Display current gas price information.

**Parameters:** None

**Example:**
```
/gas-price
```

**Response Format:**
```
⛽ Current Gas Price
├─ Network: CASPER
├─ Gas Price: 50 gwei
├─ Max Fee Per Gas: 60 gwei
└─ Priority Fee: 2 gwei
```

#### `/gas-estimate`
Estimate gas fees for a transaction.

**Parameters:**
- `from` (required): Sender address
- `to` (required): Receiver address
- `value` (optional): Transfer amount in ETH (default: 0)

**Example:**
```
/gas-estimate from:0xSender... to:0xReceiver... value:0.1
```

**Response Format:**
```
📊 Gas Estimate
├─ From: 0xSender...
├─ To: 0xReceiver...
├─ Amount: 0.1 ETH
├─ Gas Limit: 21000
├─ Estimated Fee: 0.00105 ETH
└─ Total Cost: 0.10105 ETH
```

---

## 🔔 Alert Skill

**Location**: `src/skills/alert/`  
**Version**: 1.0.0

### Description
Monitor blockchain events and send notifications when conditions are met.

### Commands

#### `/alert add`
Create a new alert.

**Parameters:**
- `type` (required): Alert type (balance/gas/custom)
- `address` (optional): Wallet address to monitor
- `threshold` (optional): Trigger threshold value
- `message` (optional): Custom message for custom alerts

**Examples:**
```
/alert add type:balance address:0x742d... threshold:1.5
/alert add type:gas threshold:100
/alert add type:custom message:"Daily check-in"
```

**Alert Types:**
- **balance**: Monitor wallet balance changes
- **gas**: Monitor gas price thresholds
- **custom**: Send periodic custom messages

#### `/alert list`
View all active alerts.

**Parameters:** None

**Example:**
```
/alert list
```

**Response Format:**
```
📋 Active Alerts (3)
├─ alert_123: Balance alert for 0x742d... (> 1.5 ETH)
├─ alert_456: Gas price alert (< 100 gwei)
└─ alert_789: Custom message "Daily check-in"
```

#### `/alert remove`
Delete an existing alert.

**Parameters:**
- `id` (required): Alert ID to remove

**Example:**
```
/alert remove id:alert_1234567890_abc123
```

### How It Works

The Alert Skill uses a cron-based scheduler that:
1. Runs every 60 seconds (configurable via `ALERT_CHECK_INTERVAL`)
2. Checks all active alerts against current blockchain state
3. Sends notifications when conditions are met
4. Logs all triggered alerts

**Note**: Currently uses in-memory storage. Alerts are lost on restart. Database persistence is planned for future versions.

---

## 📢 Push Skill

**Location**: `src/skills/push/`  
**Version**: 1.0.0

### Description
Push notification messages to Telegram chats.

### Commands

#### `/push`
Send a message to current chat.

**Parameters:**
- `message` (required): Message content to send

**Examples:**
```
/push System maintenance scheduled for tonight at 10 PM
```

**Response Format:**
```
✅ Message pushed successfully
```

The actual message appears in the chat as:
```
📢 *Casper Notification*

[Your message content]
```

---

## Skill Architecture

All skills follow the same pattern:

```
src/skills/{skill-name}/
├── {SkillName}Skill.ts   # Main skill class extending BaseSkill
├── commands.ts            # SlashCommandBuilder definitions
├── handler.ts             # Command handler functions
└── index.ts               # Export statement
```

### Base Class
All skills extend `BaseSkill` which provides:
- Lifecycle management (initialize/destroy)
- Metadata tracking
- Command routing
- Initialization state checking

### Registration
Skills are registered in `src/index.ts`:
```typescript
await skillManager.registerSkill(new BalanceSkill())
await skillManager.registerSkill(new GasSkill())
await skillManager.registerSkill(new AlertSkill())
await skillManager.registerSkill(new PushSkill())
```

---

## Creating Custom Skills

See [SKILL_DEVELOPMENT.md](SKILL_DEVELOPMENT.md) for a complete guide on creating your own skills.

### Quick Template

```typescript
import { BaseSkill } from '../../skills/BaseSkill'
import { ChatInputCommandInteraction } from 'discord.js'
import { myCommand } from './commands'
import { handleMyCommand } from './handler'

export class MySkill extends BaseSkill {
  constructor() {
    super({
      name: 'my-skill',
      version: '1.0.0',
      description: 'My custom skill description',
      author: 'Your Name',
      commands: [myCommand]
    })
  }
  
  async handleCommand(interaction: ChatInputCommandInteraction) {
    await handleMyCommand(interaction)
  }
}
```

---

## Future Skills (Planned)

These skills are planned for future releases:

- **Transaction Skill**: Execute transactions on Casper
- **Token Skill**: Token transfer and approval
- **NFT Skill**: NFT balance and transfers
- **Price Skill**: Token price queries
- **Staking Skill**: Staking operations
- **Governance Skill**: DAO voting and proposals

---

**Total Skills**: 4  
**Total Commands**: 7  
**Last Updated**: 2026-06-18
