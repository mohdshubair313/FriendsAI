const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('='.repeat(60));
  console.log('TEST 1: Check if server is running');
  console.log('='.repeat(60));
  
  try {
    const home = await makeRequest({ hostname: 'localhost', port: 3000, path: '/' });
    console.log('Homepage Status:', home.status);
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Check /api/auth/session');
  console.log('='.repeat(60));
  
  try {
    const session = await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/auth/session' });
    console.log('Session Status:', session.status);
    console.log('Session Body:', session.body.substring(0, 500));
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Try /api/orchestrate without auth');
  console.log('='.repeat(60));
  
  const body = JSON.stringify({
    messages: [{ role: "user", content: "hi" }],
    mood: "friendly"
  });
  
  try {
    const orchestrate = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orchestrate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, body);
    console.log('Orchestrate Status:', orchestrate.status);
    console.log('Orchestrate Body:', orchestrate.body);
  } catch (e) {
    console.log('ERROR:', e.message);
  }
}

test().then(() => console.log('\nTests complete!')).catch(console.error);