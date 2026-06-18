const { ethers } = require('ethers');

async function testRPC() {
  const rpcUrl = 'https://rpc.casper.network';
  const chainId = 1;
  
  console.log('Testing Casper RPC endpoint...\n');
  console.log('URL:', rpcUrl);
  console.log('Chain ID:', chainId);
  console.log('');
  
  const network = {
    chainId: chainId,
    name: 'casper'
  };
  
  const provider = new ethers.JsonRpcProvider(rpcUrl, network, {
    staticNetwork: true,
    batchMaxCount: 1,
  });
  
  try {
    console.log('Attempting to get block number...');
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Success! Block number:', blockNumber);
    
    console.log('\nAttempting to get gas price...');
    const feeData = await provider.getFeeData();
    console.log('✅ Gas price:', ethers.formatUnits(feeData.gasPrice || 0, 'gwei'), 'Gwei');
    
    console.log('\nAttempting to get balance for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045...');
    const balance = await provider.getBalance('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    console.log('✅ Balance:', ethers.formatEther(balance), 'ETH');
    
    console.log('\n🎉 All tests passed! RPC is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }
}

testRPC();
