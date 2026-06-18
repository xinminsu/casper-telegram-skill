const { ethers } = require('ethers');

async function debugGasEstimate() {
  const rpcUrl = 'https://rpc.casper.network';
  const chainId = 1;
  
  const network = {
    chainId: chainId,
    name: 'casper'
  };
  
  const provider = new ethers.JsonRpcProvider(rpcUrl, network, {
    staticNetwork: true,
    batchMaxCount: 1,
  });
  
  const from = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  const to = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';
  const value = '0.1';
  
  console.log('=== Gas Estimation Debug Info ===\n');
  console.log('From:', from);
  console.log('To:', to);
  console.log('Value:', value, 'ETH\n');
  
  try {
    // Check from balance
    console.log('1. Checking from address balance...');
    const fromBalance = await provider.getBalance(from);
    console.log('   Balance:', ethers.formatEther(fromBalance), 'ETH');
    
    if (fromBalance < ethers.parseEther(value)) {
      console.log('   ❌ INSUFFICIENT BALANCE for', value, 'ETH transfer');
      return;
    }
    console.log('   ✅ Sufficient balance\n');
    
    // Check if to is a contract
    console.log('2. Checking destination address type...');
    const code = await provider.getCode(to);
    const isContract = code !== '0x';
    
    if (isContract) {
      console.log('   ⚠️  Destination is a SMART CONTRACT');
      console.log('   Code length:', code.length, 'characters');
      console.log('   This contract may reject direct ETH transfers\n');
    } else {
      console.log('   ✅ Destination is a regular wallet address (EOA)\n');
    }
    
    // Try to estimate gas
    console.log('3. Attempting gas estimation...');
    try {
      const gasLimit = await provider.estimateGas({
        from,
        to,
        value: ethers.parseEther(value),
        data: '0x'
      });
      console.log('   ✅ Gas limit:', gasLimit.toString());
      
      const feeData = await provider.getFeeData();
      console.log('   Gas price:', ethers.formatUnits(feeData.gasPrice || 0, 'gwei'), 'Gwei');
      
      const estimatedCost = ethers.formatEther(gasLimit * (feeData.gasPrice || 0n));
      console.log('   Estimated cost:', estimatedCost, 'ETH');
      
    } catch (error) {
      console.log('   ❌ Gas estimation failed');
      console.log('   Error:', error.message);
      console.log('\n   Possible reasons:');
      console.log('   - The transaction would revert on-chain');
      console.log('   - The recipient address has restrictions');
      console.log('   - Network conditions prevent this transaction');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugGasEstimate();
