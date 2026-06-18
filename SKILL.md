# Casper Telegram Bot — Codex Skill Guide

This file provides Codex (the coding agent) with the context, conventions, and patterns needed when working on this project.

## Project Overview

**Casper Telegram Bot** is a Telegram bot built with TypeScript and `telegraf` that provides blockchain query and notification features for the Casper network. It uses a modular **Skill-based architecture** where each feature is an independent skill module managed by a central `SkillManager`.

### Tech Stack

- **Runtime**: Node.js (ES2020 target)
- **Language**: TypeScript (strict mode)
- **Framework**: telegraf v4
- **Blockchain**: ethers v6
- **Scheduling**: node-cron
- **Logging**: winston
- **Build**: tsc (no bundler)

### Directory Layout

```
src/
├── index.ts                 # Entry point — Telegram bot init, skill registration
├── core/
│   └── SkillManager.ts      # Skill lifecycle: register, route commands, shutdown
├── skills/
│   ├── types.ts             # Skill interface, SkillMetadata, SkillConfig
│   ├── BaseSkill.ts         # Abstract base class all skills extend
│   ├── SkillRegistry.ts     # In-memory Map-based skill registry
│   ├── index.ts             # Re-exports types, BaseSkill, SkillRegistry
│   ├── balance/             # ETH & ERC20 balance query skill
│   ├── gas/                 # Gas price & gas estimation skill
│   ├── alert/               # Balance/gas/custom alert monitoring skill
│   └── push/                # Message push to Telegram chats skill
├── services/
│   └── web3Service.ts       # Shared blockchain RPC layer (ethers provider)
└── utils/
    └── logger.ts            # Winston logger configuration
```

## How to Add a New Skill

Each skill lives in its own directory under `src/skills/<skill-name>/` and follows this structure:

```
src/skills/<skill-name>/
├── <SkillName>Skill.ts   # Extends BaseSkill, wires commands & handler
├── commands.ts           # Command name definitions (string arrays)
├── handler.ts            # Command logic / business logic
└── index.ts              # Re-exports the skill class
```

### Step-by-step

1. **Create the directory** `src/skills/<name>/`

2. **Define commands** (`commands.ts`):
   - Export command names as string arrays.
   - Use kebab-case for command names (e.g., `['my-command']`).

3. **Implement handler** (`handler.ts`):
   - Export async functions that accept `Context` from telegraf.
   - Parse command arguments from `ctx.message.text` by splitting on spaces.
   - Always import `logger` from `../../utils/logger` for logging.

4. **Create skill class** (`<Name>Skill.ts`):
   - Extend `BaseSkill` and pass config to `super({...})`.
   - Implement `handleCommand(ctx)` to route to the correct handler.
   - Override `initialize()` / `destroy()` only when lifecycle setup/teardown is needed (e.g. starting a cron job).

5. **Export** (`index.ts`):
   ```ts
   export { MySkill } from './MySkill';
   ```

6. **Register** in `src/index.ts`:
   ```ts
   await skillManager.registerSkill(new MySkill());
   ```

### Skill Class Constructor Pattern

```ts
super({
  name: '<kebab-case-name>',
  version: '1.0.0',
  description: 'One-line description',
  author: 'Casper Team',
  commands: [commandBuilder],
});
```

### Handler Conventions

- Use Markdown formatting for rich responses (Telegram supports Markdown parse mode).
- Use `ethers.getAddress(address.toLowerCase())` for checksum conversion before passing addresses to web3Service.
- Validate Ethereum addresses with regex `/^0x[a-fA-F0-9]{40}$/` before processing.
- Log key events with `logger.info()` and errors with `logger.error()`.

## Key Patterns

### Command Routing

The `SkillManager.handleCommand()` finds which skill owns a command by iterating all skills' `.commands` arrays and matching `cmd.name === interaction.commandName`. Each skill's `handleCommand()` then switches on `interaction.commandName` (or `interaction.options.getSubcommand()` for subcommands).

### Shared Services

- **web3Service** (`src/services/web3Service.ts`): Singleton ethers provider initialized from `CASPER_RPC_URL` env var. Exports `getEthBalance`, `getTokenBalance`, `getCurrentGasPrice`, `estimateGas`.
- **Logger** (`src/utils/logger.ts`): Winston logger writing to console, `logs/error.log`, and `logs/combined.log`. Level controlled by `LOG_LEVEL` env var.

### Alert Skill (Scheduler)

The Alert skill uses `node-cron` to periodically check balance/gas thresholds. The scheduler (`src/skills/alert/scheduler.ts`) reads `ALERT_CHECK_INTERVAL` env var (default 60s). Alerts are stored in a module-level `Map` in `handler.ts`.

### Environment Variables

All config is in `.env` (see `.env.example`):
- `DISCORD_TOKEN` / `DISCORD_CLIENT_ID` — Discord authentication
- `CASPER_RPC_URL` / `CASPER_CHAIN_ID` — Blockchain RPC
- `LOG_LEVEL` — Logging verbosity
- `ALERT_CHECK_INTERVAL` — Alert polling interval (seconds)

## Naming & Style Conventions

- **Files**: PascalCase for classes/types (`BalanceSkill.ts`), camelCase for utilities/handlers (`handler.ts`).
- **Exports**: Default export only if the file is a single class; named exports otherwise.
- **Commands**: kebab-case for Discord slash command names (`gas-price`, `gas-estimate`).
- **Skill names**: kebab-case, matching the command prefix where applicable.

## Important Notes

- Never hardcode Discord tokens, private keys, or RPC URLs.
- The current alert system uses in-memory storage — not suitable for production persistence.
- The `scheduler.ts` alert notification is a stub (`logger.info` only); production needs the Discord client reference injected.
- All blockchain interaction goes through `web3Service` — do not create separate `ethers.Provider` instances in skills.
- Running `npm run build` compiles with `tsc`; the `dist/` output is `commonjs`.
- The `.env` file is in `.gitignore` — do not commit it.
- Tests are planned but not yet implemented.
