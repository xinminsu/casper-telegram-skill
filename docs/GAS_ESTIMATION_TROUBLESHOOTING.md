# Gas Estimation Troubleshooting Guide

## Issue: "Transaction would fail on-chain"

When using `/gas-estimate`, you may encounter this error:

```
❌ Transaction would fail on-chain

This usually means:
• The recipient address is invalid or unreachable
• The transaction would be rejected by the network
• Try using a different recipient address
```

---

## Root Causes

### 1. Destination Address Issues

#### A. Contract Address Rejecting ETH
Some smart contracts don't accept direct ETH transfers and will reject transactions.

**Example:**
```bash
# This might fail if the contract doesn't have a payable fallback function
/gas-estimate from:0xSender... to:0xContractAddress value:0.1
```

**Solution:** Use a regular wallet address (EOA - Externally Owned Account) instead.

#### B. Invalid or Restricted Address
The destination address might be:
- A burn address (e.g., `0x0000000000000000000000000000000000000000`)
- An address with restrictions
- Not deployed on Casper network

### 2. Insufficient Balance

If the sender address doesn't have enough ETH for the transfer + gas fees, the estimation will fail.

**Error Message:**
```
Insufficient balance: has 0.5 ETH, needs 1.0 ETH
```

### 3. Network-Specific Restrictions

Casper network may have specific rules that prevent certain transactions.

---

## Improved Error Handling

The bot now provides detailed diagnostics:

### Before Enhancement
```
❌ Estimation failed: CALL_EXCEPTION
```

### After Enhancement
```
❌ Gas estimation failed

The destination address is a smart contract that rejected the transaction.

Suggestion: Try with a different recipient address (e.g., a regular wallet address)
```

Or:
```
❌ Gas estimation failed

Insufficient balance: has 0.05 ETH, needs 0.1 ETH
```

---

## How It Works

The improved `estimateGas` function now performs these checks:

### Step 1: Balance Verification
```typescript
const fromBalance = await provider.getBalance(from);
if (fromBalance < transferValue) {
  throw new Error(`Insufficient balance: has ${ethers.formatEther(fromBalance)} ETH, needs ${value} ETH`);
}
```

### Step 2: Contract Detection
```typescript
const code = await provider.getCode(to);
const isContract = code !== '0x';
```

### Step 3: Smart Error Messages
```typescript
if (isContract) {
  reason = `The destination address is a smart contract that rejected the transaction.`;
} else {
  reason = `The transaction would fail on-chain. The destination address may be invalid or restricted.`;
}
```

---

## Testing with Valid Addresses

### Recommended Test Addresses

Use these well-known addresses for testing:

1. **Vitalik's Address** (public, accepts ETH):
   ```
   /gas-estimate from:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 to:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 value:0.001
   ```

2. **Zero Address** (will fail - good for testing error handling):
   ```
   /gas-estimate from:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 to:0x0000000000000000000000000000000000000000 value:0.001
   ```

### Example Successful Response

```
⛽ Gas Estimation Result

From: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
To: 0x742d35cC6634c0532925A3b844bc9E7595F0beB1
Amount: 0.1 ETH
Network: Casper

Gas Limit: 21000
Gas Price: 10.5 Gwei
Max Fee Per Gas: 12.0 Gwei
Priority Fee: 1.5 Gwei

Estimated Total Cost: 0.0002205 ETH
```

---

## Common Scenarios

### Scenario 1: Sending to Self
✅ **Works** - Good for testing
```bash
/gas-estimate from:0xYourAddress to:0xYourAddress value:0.001
```

### Scenario 2: Sending to Known Wallet
✅ **Should work** if address exists
```bash
/gas-estimate from:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 to:0x742d35cC6634c0532925A3b844bc9E7595F0beB1 value:0.1
```

### Scenario 3: Sending to Contract
❌ **May fail** if contract rejects ETH
```bash
/gas-estimate from:0xYourAddress to:0xContractAddress value:0.1
```

### Scenario 4: Insufficient Balance
❌ **Will fail** with clear message
```bash
# If address has 0 ETH
/gas-estimate from:0xEmptyAddress to:0xOtherAddress value:1.0
# Error: Insufficient balance: has 0 ETH, needs 1.0 ETH
```

---

## Debugging Tips

### 1. Check Address Type
Before estimating gas, verify what type of address you're sending to:

```bash
# Check if address is a contract
/balance address:0xTargetAddress
```

If it returns an error or shows it's a contract, try a different address.

### 2. Verify Sender Balance
Make sure the sender has enough ETH:

```bash
/balance address:0xSenderAddress
```

### 3. Start Small
Test with very small amounts first:

```bash
/gas-estimate from:0xSender to:0xReceiver value:0.0001
```

### 4. Use Different Recipients
If one address fails, try another:
- Use your own address as both sender and receiver
- Use well-known public addresses
- Avoid contract addresses unless you know they accept ETH

---

## Technical Details

### Why estimateGas Can Fail

The `provider.estimateGas()` method simulates the transaction on-chain without actually executing it. It can fail when:

1. **Revert Conditions**: The transaction would trigger a `revert()` in Solidity
2. **Out of Gas**: The operation requires more gas than available
3. **Invalid State**: The current blockchain state prevents the transaction
4. **Access Control**: The contract has restrictions on who can interact with it

### Ethers.js Error Types

| Error Code | Meaning | Action |
|------------|---------|--------|
| `CALL_EXCEPTION` | Transaction reverted | Try different address |
| `INSUFFICIENT_FUNDS` | Not enough balance | Add funds to sender |
| `TIMEOUT` | RPC not responding | Check connection/retry |
| `INVALID_ARGUMENT` | Bad input | Verify address format |

---

## Best Practices

### For Users
1. ✅ Always verify addresses before sending
2. ✅ Start with small test amounts
3. ✅ Use wallet addresses (not contracts) for simple transfers
4. ✅ Check sender balance before estimating

### For Developers
1. ✅ Implement comprehensive error handling
2. ✅ Provide clear, actionable error messages
3. ✅ Pre-validate inputs before calling RPC
4. ✅ Detect contract addresses and warn users
5. ✅ Check balances before estimation

---

## Related Files

- `src/services/web3Service.ts` - Gas estimation logic
- `src/skills/gas/handler.ts` - Command handler
- `docs/CHECKSUM_FIX.md` - Address format requirements

---

**Last Updated**: 2026-06-17  
**Status**: Enhanced with better error messages  
**Next Steps**: Consider adding automatic retry logic or fallback addresses
