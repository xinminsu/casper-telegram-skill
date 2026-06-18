# Casper 原生地址支持

本项目现已完全支持Casper区块链的原生地址格式，同时保持与以太坊风格地址的兼容性。

## 📋 支持的地址格式

### 1. 以太坊风格地址 (Ethereum-style)
- **格式**: `0x` + 40个十六进制字符
- **示例**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1`
- **长度**: 42字符

### 2. Casper账户哈希 (Account Hash)
- **格式**: `account-hash-` + 64个十六进制字符
- **示例**: `account-hash-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
- **长度**: 79字符
- **说明**: Casper网络的标准账户标识符

### 3. Casper公钥 (Public Key)
- **格式**: 
  - Ed25519: `01` + 64个十六进制字符
  - Secp256k1: `02`或`03` + 64个十六进制字符
- **示例**: `02abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab`
- **长度**: 66字符
- **说明**: 用于从公钥派生账户地址

## 🔄 自动地址转换

Bot会自动检测和转换所有支持的地址格式：

```
用户输入 → 地址检测 → 格式验证 → 转换为标准格式 → 查询区块链
```

### 转换示例

**输入以太坊地址:**
```
/balance 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
```

**响应:**
```
💰 Casper Balance

Original Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
Address Type: ethereum

Casper Account Hash: account-hash-...

Balance: 123.456 CSPR
Network: Casper
```

**输入Casper公钥:**
```
/balance 02abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab
```

**响应:**
```
💰 Casper Balance

Original Address: 02abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab
Address Type: public-key

Casper Account Hash: account-hash-...

Balance: 123.456 CSPR
Network: Casper
```

## 🛠️ 技术实现

### CasperAddressUtils 工具类

位置: `src/utils/casperAddress.ts`

#### 主要功能

1. **地址类型检测**
   ```typescript
   CasperAddressUtils.getAddressType(address)
   // 返回: 'ethereum' | 'account-hash' | 'public-key' | 'unknown'
   ```

2. **地址标准化**
   ```typescript
   CasperAddressUtils.normalizeAddress(address)
   // 将任何格式转换为 account-hash 格式
   ```

3. **格式转换**
   ```typescript
   // 以太坊 → Casper账户哈希
   CasperAddressUtils.ethToAccountHash(ethAddress)
   
   // Casper账户哈希 → 以太坊
   CasperAddressUtils.accountHashToEth(accountHash)
   ```

4. **格式验证**
   ```typescript
   CasperAddressUtils.isEthereumStyle(address)
   CasperAddressUtils.isAccountHash(address)
   CasperAddressUtils.isPublicKeyHex(address)
   ```

### Web3Service 集成

位置: `src/services/web3Service.ts`

所有区块链查询函数现在都支持多种地址格式：

- `getEthBalance(address)` - 支持所有格式
- `getTokenBalance(tokenAddress, walletAddress)` - 支持所有格式
- `estimateGas(from, to, ...)` - 支持所有格式

## 📝 使用示例

### 查询余额

```bash
# 以太坊格式
/balance 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1

# Casper账户哈希
/balance account-hash-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Casper公钥
/balance 02abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab
```

### 查询代币余额

```bash
# 第二个参数也支持所有格式
/balance 0xWalletAddress 0xTokenAddress
/balance account-hash-Wallet account-hash-Token
```

### Gas估算

```bash
# 发送方和接收方都支持所有格式
/gas-estimate 0xFrom 0xTo 1.5
/gas-estimate account-hash-From account-hash-To 1.5
```

## 🔍 地址格式识别规则

### 以太坊地址
- 必须以 `0x` 开头
- 后面跟随40个十六进制字符 (0-9, a-f, A-F)
- 不区分大小写

### Casper账户哈希
- 必须以 `account-hash-` 开头
- 后面跟随64个十六进制字符
- 这是Casper网络的官方格式

### Casper公钥
- 以 `01` (Ed25519), `02`, 或 `03` (Secp256k1) 开头
- 总共66个十六进制字符
- 前缀表示加密算法类型

## ⚠️ 注意事项

1. **向后兼容**: 现有的以太坊格式地址仍然完全可用
2. **自动转换**: Bot会自动将所有地址转换为内部使用的标准格式
3. **显示信息**: 响应中会显示原始地址类型和转换后的Casper账户哈希
4. **错误处理**: 如果地址格式无效，会提供清晰的错误信息和支持的格式列表

## 🎯 优势

1. **灵活性**: 用户可以使用任何熟悉的地址格式
2. **兼容性**: 同时支持以太坊生态和Casper原生用户
3. **透明度**: 清楚显示地址转换过程
4. **易用性**: 无需手动转换地址格式

## 📚 相关文档

- [Casper SDK Documentation](https://docs.casper.network/)
- [Casper Address Format](https://docs.casper.network/concepts/accounts-and-keys.html)
- [Telegram Bot Commands](../QUICKSTART.md)

---

**提示**: 如果不确定地址格式，可以直接尝试使用，Bot会自动识别并告知结果！
