const https = require('https');

const url = 'https://rpc.casper.network';
const data = JSON.stringify({
  jsonrpc: '2.0',
  method: 'eth_blockNumber',
  params: [],
  id: 1
});

console.log('Testing RPC endpoint...');
console.log('URL:', url);
console.log('');

const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', body);
    
    try {
      const result = JSON.parse(body);
      if (result.result) {
        const blockNumber = parseInt(result.result, 16);
        console.log('\n✅ RPC is working!');
        console.log('Current block number:', blockNumber);
      } else {
        console.log('\n❌ RPC returned error:', result.error);
      }
    } catch (e) {
      console.log('\n❌ Failed to parse response');
    }
  });
});

req.on('error', (error) => {
  console.log('\n❌ Request failed:', error.message);
});

req.setTimeout(10000, () => {
  console.log('\n❌ Request timeout after 10 seconds');
  req.destroy();
});

req.write(data);
req.end();
