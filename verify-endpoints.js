const https = require('https');
const http = require('http');

const endpoints = [
  'https://thyrogendiagnostic.in/',
  'https://thyrogendiagnostic.in/doctors',
  'https://thyrogendiagnostic.in/tests',
  'https://thyrogendiagnostic.in/api/v1/user/doctors',
  'https://opd.thyrogendiagnostic.in/',
  'https://opd.thyrogendiagnostic.in/api/v1/user/doctors',
];

function checkUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { rejectUnauthorized: false, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          length: data.length,
          snippet: data.slice(0, 120).replace(/\n/g, ' '),
        });
      });
    });

    req.on('error', (err) => {
      resolve({ url, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, error: 'TIMEOUT' });
    });
  });
}

async function run() {
  console.log('Testing live endpoints over HTTPS...\n');
  for (const ep of endpoints) {
    const result = await checkUrl(ep);
    if (result.error) {
      console.log(`❌ ${ep} -> Error: ${result.error}`);
    } else {
      console.log(`✅ ${ep} -> Status: ${result.status} | Size: ${result.length}B | ${result.snippet}`);
    }
  }
}

run();
