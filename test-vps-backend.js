const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testEndpoints() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: 'Ml0NqUQECgW2nFDF'
  });

  const postRes = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:5001/api/v1/settings/general/commission-settings -H "Content-Type: application/json" -d '{"registeredSelfPercentage":5,"registeredOtherPercentage":8,"guestSelfPercentage":0,"guestOtherPercentage":0,"defaultPercentage":5}'`);
  console.log('--- POST COMMISSION SETTINGS ---');
  console.log(postRes.stdout);

  const curlSettings = await ssh.execCommand('curl -s http://127.0.0.1:5001/api/v1/settings/general');
  console.log('\n--- VERIFY GENERAL SETTINGS ---');
  console.log(curlSettings.stdout);

  ssh.dispose();
}

testEndpoints().catch(err => {
  console.error(err);
  ssh.dispose();
});
