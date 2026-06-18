# RPC Timeout Troubleshooting Guide

## Issue

When testing blockchain queries, you may encounter:

```
❌ Query failed: request timeout (code=TIMEOUT, version=6.16.0)
```

Or after the fix:

```
❌ Pharos RPC node is not responding. Please check your connection or try again later.
```

---

## Root Cause

The Casper RPC endpoint (`https://rpc.casper.network`) is:
- **Slow to respond** or
- **Currently unavailable** or
- **Rate limiting requests**

This causes the ethers.js provider to timeout waiting for a response.

---

## Fixes Applied

### 1. Added Request Timeout (10 seconds)

All RPC calls now have a 10-second timeout to prevent hanging indefinitely.

**Before:**
```typescript
const balance = await provider.getBalance(address);
// Could hang forever if RPC is down
```

**After:**
```typescript
const balance = await withTimeout(provider.getBalance(address), 10000);
// Will timeout after 10 seconds with clear error message
```

### 2. Better Error Messages

Users now see helpful error messages instead of cryptic timeout codes.

**Before:**
```
❌ Query failed: request timeout (code=TIMEOUT, version=6.16.0)
```

**After:**
```
❌ Casper RPC node is not responding. Please check your connection or try again later.
```

### 3. Provider Configuration

Optimized provider settings for better performance:

```typescript
new ethers.JsonRpcProvider(rpcUrls.pharos, undefined, {
  staticNetwork: true,      // Don't auto-detect network
  batchMaxCount: 1,         // Disable batching
})
```

---

## Solutions

### Solution 1: Use Alternative RPC URL (Recommended)

If the default Casper RPC is slow, try these alternatives:

#### Option A: Public Casper RPCs
```env
# Try different endpoints
CASPER_RPC_URL=https://casper-testnet-rpc.example.com
# or
CASPER_RPC_URL=https://casper-mainnet.example.org/rpc
```

#### Option B: Run Your Own Node
```bash
# If you have access to a Casper node
CASPER_RPC_URL=http://localhost:8545
```

#### Option C: Use Infura/Alchemy (if they support Casper)
```env
CASPER_RPC_URL=https://casper.infura.io/v3/YOUR_PROJECT_ID
```

### Solution 2: Increase Timeout

If the RPC is just slow but works, increase the timeout:

Edit `src/services/web3Service.ts`:

```typescript
// Change from 10000 (10s) to 30000 (30s)
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T>
```

### Solution 3: Add Retry Logic

For production, implement automatic retries:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Testing RPC Connectivity

### Test 1: Check RPC URL in Browser

Open this URL in your browser:
```
https://rpc.casper.network
```

**Expected**: Should show some JSON-RPC response or error page  
**If blank/error**: RPC is down

### Test 2: Use curl

```bash
curl -X POST https://rpc.casper.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected Response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x123456"}
```

### Test 3: Use ethers.js Directly

Create a test script:

```javascript
const { ethers } = require('ethers');

async function testRPC() {
  const provider = new ethers.JsonRpcProvider('https://rpc.casper.network');
  
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log('Connected! Block number:', blockNumber);
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testRPC();
```

Run it:
```bash
node test-rpc.js
```

---

## Finding Alternative RPC URLs

### Official Sources

1. **Pharos Documentation**
   - Check official docs for recommended RPC endpoints
   - Look for "Network Information" or "RPC Endpoints" section

2. **Chainlist.org**
   - Visit: https://chainlist.org
   - Search for "Pharos"
   - Copy RPC URL from the list

3. **Pharos Discord/Telegram**
   - Ask community for working RPC URLs
   - Check announcements channel for updates

4. **Block Explorers**
   - Pharos block explorer may list RPC endpoints
   - Look for "API" or "Developer" sections

---

## Common RPC Issues

### Issue 1: Rate Limiting

**Symptom**: Works sometimes, fails other times

**Solution**: 
- Add delays between requests
- Use API key if required
- Switch to paid RPC service

### Issue 2: Network Congestion

**Symptom**: Very slow responses (>10 seconds)

**Solution**:
- Increase timeout to 30-60 seconds
- Use faster RPC endpoint
- Retry with exponential backoff

### Issue 3: RPC Down

**Symptom**: Connection refused or timeout every time

**Solution**:
- Check status page (if available)
- Try alternative RPC URL
- Wait and retry later

### Issue 4: CORS Errors

**Symptom**: Works in terminal, fails in browser

**Solution**:
- Use proxy server
- Enable CORS on your RPC node
- Use backend-to-backend communication

---

## Monitoring RPC Health

### Simple Health Check Script

```typescript
// src/utils/rpcHealthCheck.ts
import { providers } from '../services/web3Service';
import { logger } from './logger';

export async function checkRPCH health(): Promise<boolean> {
  try {
    const blockNumber = await providers.pharos.getBlockNumber();
    logger.info(`RPC healthy. Current block: ${blockNumber}`);
    return true;
  } catch (error) {
    logger.error('RPC health check failed:', error);
    return false;
  }
}

// Check every 5 minutes
setInterval(checkRPCH health, 5 * 60 * 1000);
```

---

## Production Recommendations

### 1. Use Multiple RPC Endpoints

```typescript
const rpcUrls = [
  'https://rpc.pharos.network',
  'https://backup-rpc.pharos.network',
  'https://pharos.alternative-rpc.com',
];

// Rotate through them on failure
```

### 2. Implement Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}
```

### 3. Add Caching

Cache frequently accessed data to reduce RPC calls:

```typescript
const balanceCache = new Map<string, { balance: string; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

async function getCachedBalance(address: string): Promise<string> {
  const cached = balanceCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.balance;
  }
  
  const balance = await getEthBalance(address);
  balanceCache.set(address, { balance, timestamp: Date.now() });
  return balance;
}
```

---

## Quick Fix Checklist

When encountering RPC timeout:

1. ✅ **Check internet connection**
2. ✅ **Test RPC URL in browser/curl**
3. ✅ **Try alternative RPC endpoint**
4. ✅ **Increase timeout if RPC is just slow**
5. ✅ **Check Pharos network status**
6. ✅ **Review rate limiting policies**
7. ✅ **Consider running own node**

---

## Current Configuration

**Default RPC**: `https://rpc.pharos.network`  
**Timeout**: 10 seconds  
**Retry**: Not implemented (manual retry needed)  
**Fallback**: None (single endpoint)

To change: Edit `.env` file:
```env
PHAROS_RPC_URL=your_alternative_rpc_url
```

Then restart the bot:
```bash
npm run dev
```

---

## Related Files

- `src/services/web3Service.ts` - RPC provider configuration
- `.env` - RPC URL configuration
- `src/skills/balance/handler.ts` - Balance query implementation
- `src/skills/gas/handler.ts` - Gas query implementation

---

**Last Updated**: 2026-06-17  
**Status**: Timeout handling implemented  
**Next Steps**: Add retry logic and fallback RPCs
