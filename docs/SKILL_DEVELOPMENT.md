# Skill Development Guide

## Overview

This guide explains how to create new skills for the Casper Telegram Bot using the Skill-based architecture.

## What is a Skill?

A **Skill** is a modular, self-contained feature that provides specific functionality to the Telegram bot. Each skill:
- Has its own commands
- Handles its own business logic
- Can be independently loaded/unloaded
- Follows a standard interface

## Skill Structure

Every skill should follow this structure:

```
src/skills/{skill-name}/
├── {SkillName}Skill.ts   # Main skill class
├── commands.ts            # Command definitions
├── handler.ts             # Command handler logic
└── index.ts               # Export
```

## Creating a New Skill

### Step 1: Create Skill Directory

```bash
mkdir -p src/skills/my-skill
```

### Step 2: Define Commands

Create `commands.ts`:

```typescript
// Telegram commands are simple string arrays
export const myCommands = ['my-command'];
```

### Step 3: Create Handler

Create `handler.ts`:

```typescript
import { Context } from 'telegraf';
import { logger } from '../../utils/logger';

export async function handleMyCommand(ctx: Context) {
  // Get command arguments from message text
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1); // Remove command name
  
  try {
    // Your business logic here
    const param = args[0];
    
    await ctx.reply('✅ Success!');
    
    logger.info('My command executed successfully');
  } catch (error) {
    logger.error('My command failed:', error);
    await ctx.reply('❌ Error occurred');
  }
}
```

### Step 4: Create Skill Class

Create `{SkillName}Skill.ts`:

```typescript
import { BaseSkill } from '../../skills/BaseSkill';
import { Context } from 'telegraf';
import { myCommands } from './commands';
import { handleMyCommand } from './handler';

export class MySkill extends BaseSkill {
  constructor() {
    super({
      name: 'my-skill',
      version: '1.0.0',
      description: 'Description of your skill',
      author: 'Your Name',
      commands: myCommands,
    });
  }
  
  async handleCommand(ctx: Context): Promise<void> {
    // Get command name from message text
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const commandName = text.split(' ')[0].replace('/', '');
    
    switch (commandName) {
      case 'my-command':
        await handleMyCommand(ctx);
        break;
      default:
        throw new Error(`Unknown command: ${commandName}`);
    }
  }
}
```

### Step 5: Export Skill

Create `index.ts`:

```typescript
export { MySkill } from './MySkill';
```

### Step 6: Register Skill

In your main application file:

```typescript
import { SkillManager } from './core/SkillManager';
import { MySkill } from './skills/my-skill';

const skillManager = new SkillManager();

// Initialize
await skillManager.initialize();

// Register your skill
const mySkill = new MySkill();
await skillManager.registerSkill(mySkill);
```

## Skill Lifecycle

### Initialization

When a skill is registered, the `initialize()` method is called:

```typescript
async initialize(): Promise<void> {
  // Setup databases, connections, etc.
  await super.initialize();
  
  // Your custom initialization
  this.database = await connectDatabase();
}
```

### Command Handling

All commands are routed through `handleCommand()`:

```typescript
async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Route to appropriate handler based on command name
}
```

### Cleanup

When a skill is unregistered, the `destroy()` method is called:

```typescript
async destroy(): Promise<void> {
  // Cleanup resources
  await this.database.disconnect();
  
  await super.destroy();
}
```

## Best Practices

### 1. Single Responsibility

Each skill should do ONE thing well.

✅ Good:
- BalanceSkill: Only handles balance queries
- GasSkill: Only handles gas-related operations

❌ Bad:
- MegaSkill: Handles balances, gas, alerts, and notifications

### 2. Error Handling

Always handle errors gracefully:

```typescript
try {
  // Your logic
} catch (error) {
  logger.error('Descriptive error message', error);
  await interaction.editReply({
    content: '❌ User-friendly error message',
  });
}
```

### 3. Logging

Log important events:

```typescript
logger.info('Action started');
logger.debug('Debug information');
logger.warn('Warning condition');
logger.error('Error occurred', error);
```

### 4. Validation

Validate all user inputs:

```typescript
if (!isValidAddress(address)) {
  await interaction.editReply({
    content: '❌ Invalid address format',
  });
  return;
}
```

### 5. Documentation

Document your skill:
- Add JSDoc comments
- Update README with usage examples
- Include parameter descriptions

## Testing Your Skill

### Manual Testing

1. Start the bot in development mode
2. Use the command in Discord
3. Check logs for errors
4. Verify expected behavior

### Unit Testing (Future)

```typescript
describe('MySkill', () => {
  it('should handle command correctly', async () => {
    const skill = new MySkill();
    await skill.initialize();
    
    // Test your skill
  });
});
```

## Advanced Features

### Skill Configuration

Add configuration support:

```typescript
interface MySkillConfig {
  cacheTimeout: number;
  maxRetries: number;
}

export class MySkill extends BaseSkill {
  private config: MySkillConfig;
  
  constructor(config: MySkillConfig) {
    super({...});
    this.config = config;
  }
}
```

### Skill Dependencies

Skills can depend on shared services:

```typescript
import { Web3Service } from '../../services/Web3Service';

export class MySkill extends BaseSkill {
  private web3Service: Web3Service;
  
  constructor(web3Service: Web3Service) {
    super({...});
    this.web3Service = web3Service;
  }
}
```

### Scheduled Tasks

Use node-cron for periodic tasks:

```typescript
import cron from 'node-cron';

export class MySkill extends BaseSkill {
  private cronJob?: cron.ScheduledTask;
  
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Run every hour
    this.cronJob = cron.schedule('0 * * * *', async () => {
      await this.performScheduledTask();
    });
  }
  
  async destroy(): Promise<void> {
    this.cronJob?.stop();
    await super.destroy();
  }
}
```

## Example Skills

Check out these example skills in the codebase:
- `BalanceSkill`: Simple query skill
- (More coming soon...)

## Troubleshooting

### Skill Not Loading

Check:
1. Skill is properly exported in `index.ts`
2. No syntax errors in TypeScript
3. All dependencies are installed

### Commands Not Appearing

Check:
1. Skill is registered with SkillManager
2. Bot has proper permissions
3. Wait for Discord to sync (can take up to 1 hour)

### Handler Not Called

Check:
1. Command name matches exactly
2. `handleCommand` routes to correct handler
3. No errors during initialization

## Resources

- [Telegraf Documentation](https://telegraf.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Happy Skill Building! 🚀**
