const https = require('https');

const data = JSON.stringify({
  model: "claude-3-5-sonnet-20241022",
  messages: [{ role: "user", content: "Write a 100 word story about a robot." }],
  stream: true
});

const options = {
  hostname: 'claude-talkai.ronitshrimankar1.workers.dev',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy',
    'Content-Length': data.length
  },
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let chunkCount = 0;
  const startTime = Date.now();

  res.on('data', (d) => {
    chunkCount++;
    console.log(`CHUNK ${chunkCount} at ${Date.now() - startTime}ms (${d.length} bytes)`);
    // Only print first chunk content to verify SSE
    if (chunkCount === 1) {
      console.log('--- START ---');
      console.log(d.toString().slice(0, 100));
      console.log('--- END ---');
    }
  });

  res.on('end', () => {
    console.log('Stream ended. Total chunks:', chunkCount);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
