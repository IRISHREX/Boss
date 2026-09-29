const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testEndpoints() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: 'Ml0NqUQECgW2nFDF'
  });

  console.log('--- TESTING LIVE HTTPS PUBLIC API ---');
  const res = await ssh.execCommand("curl -s https://opd.thyrogendiagnostic.in/api/v1/medical/suggestions/symptoms | head -c 200");
  console.log(res.stdout || res.stderr);

  ssh.dispose();
}

testEndpoints().catch(err => {
  console.error(err);
  ssh.dispose();
});
