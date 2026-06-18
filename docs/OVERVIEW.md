# Project Overview

Welcome to **Casper Telegram Bot** - a modern, skill-based Telegram bot for blockchain interactions on the Casper network.

---

## 🎯 What is This?

Casper Telegram Bot allows you to interact with the Casper blockchain directly from Telegram using simple commands. Query balances, check gas prices, set up alerts, and push notifications - all without leaving Telegram.

---

## ✨ Key Features

### 📊 Balance Queries
- Check ETH balances for any wallet
- Query ERC20 token balances
- Real-time data from Casper network

### ⛽ Gas Information
- Current gas prices
- Transaction fee estimation
- Detailed gas breakdowns

### 🔔 Event Monitoring
- Balance change alerts
- Gas price threshold monitoring
- Custom scheduled messages

### 📢 Notifications
- Push messages to chats
- Formatted announcements

---

## 🏗️ Architecture

This project uses a **Skill-based architecture** where each feature is an independent module:

```
src/
├── core/SkillManager.ts    # Central orchestrator
├── skills/                 # Feature modules
│   ├── balance/           # Balance queries
│   ├── gas/               # Gas operations
│   ├── alert/             # Event monitoring
│   └── push/              # Message pushing
└── services/web3Service.ts # Blockchain layer
```

**Benefits:**
- ✅ Modular and extensible
- ✅ Easy to maintain
- ✅ Simple to add new features
- ✅ Clear separation of concerns

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Main documentation with setup guide |
| [QUICKSTART.md](../QUICKSTART.md) | 5-minute quick start guide |
| [docs/ARCHITECTURE.md](ARCHITECTURE.md) | Detailed architecture documentation |
| [docs/SKILLS.md](SKILLS.md) | List of available skills and commands |
| [docs/SKILL_DEVELOPMENT.md](SKILL_DEVELOPMENT.md) | Guide for creating custom skills |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- Discord Bot Token
- Casper RPC URL

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run in development
npm run dev

# Build for production
npm run build
npm start
```

See [QUICKSTART.md](../QUICKSTART.md) for detailed instructions.

---

## 💻 Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot |
| `/help` | Show help information |
| `/balance` | Query wallet balance |
| `/gas-price` | Check current gas prices |
| `/gas-estimate` | Estimate transaction fees |
| `/alert-add` | Create new alert |
| `/alert-list` | View active alerts |
| `/alert-remove` | Delete an alert |
| `/push` | Send message to chat |

See [docs/SKILLS.md](SKILLS.md) for complete command reference.

---

## 🔧 Technology Stack

- **TypeScript**: Type-safe JavaScript
- **telegraf v4**: Telegram bot framework
- **ethers.js v6**: Blockchain interaction library
- **winston**: Logging system
- **node-cron**: Scheduled tasks
- **dotenv**: Environment configuration

---

## 🎨 Creating Custom Skills

Want to add new features? It's easy!

```typescript
import { BaseSkill } from '../skills/BaseSkill'

export class MySkill extends BaseSkill {
  constructor() {
    super({
      name: 'my-skill',
      version: '1.0.0',
      description: 'My custom feature',
      commands: [myCommand]
    })
  }
  
  async handleCommand(interaction) {
    // Your logic here
  }
}
```

See [docs/SKILL_DEVELOPMENT.md](SKILL_DEVELOPMENT.md) for complete guide.

---

## 🌐 Blockchain Support

**Current Network**: Casper only

This bot is specifically designed for the Casper blockchain network. All queries and transactions are executed on Casper.

**Configuration:**
```env
CASPER_RPC_URL=https://rpc.casper.network
CASPER_CHAIN_ID=1
```

---

## 🤝 Contributing

We welcome contributions!

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- Use TypeScript for type safety
- Follow existing code style
- Add comments for complex logic
- Update documentation when needed

---

## 📋 Roadmap

### Short Term
- [ ] Add unit tests
- [ ] Database persistence for alerts
- [ ] More blockchain query commands
- [ ] Improved error handling

### Medium Term
- [ ] Plugin system for community skills
- [ ] Hot-reload support
- [ ] Performance optimization
- [ ] Monitoring dashboard

### Long Term
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Community plugin marketplace
- [ ] WebSocket real-time updates

---

## 🆘 Support

### Need Help?
- 📖 Read [README.md](../README.md)
- 🚀 Check [QUICKSTART.md](../QUICKSTART.md)
- 🏗️ Review [ARCHITECTURE.md](ARCHITECTURE.md)
- 🐛 Submit an issue on GitHub

### Common Issues

**Commands not showing?**
- Wait a few minutes for Discord to sync
- Re-invite the bot with proper permissions

**Query failed?**
- Check your CASPER_RPC_URL is accessible
- Verify wallet address format (0x...)

**Bot offline?**
- Check terminal for error logs
- Verify DISCORD_TOKEN is correct

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🎉 Ready to Start?

1. **Setup**: Follow [QUICKSTART.md](../QUICKSTART.md)
2. **Explore**: Try the available commands
3. **Extend**: Create your own skills
4. **Share**: Contribute back to the community

---

**Version**: 2.0.0  
**Architecture**: Skill-Based  
**Network**: Casper  
**Last Updated**: 2026-06-18

Happy coding! 🚀
