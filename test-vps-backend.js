const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testEndpoints() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: 'Ml0NqUQECgW2nFDF'
  });

  const curlLocal = await ssh.execCommand('curl -s http://127.0.0.1:5001/api/v1/settings/general');
  console.log('--- LOCAL 5001 /api/v1/settings/general ---');
  console.log(curlLocal.stdout);

  const curlMedical = await ssh.execCommand('curl -s http://127.0.0.1:5001/api/v1/medical/suggestions/symptoms | head -c 120');
  console.log('\n--- MEDICAL API ---');
  console.log(curlMedical.stdout);

  const curlNginx = await ssh.execCommand("curl -s http://127.0.0.1/api/v1/settings/general -H 'Host: opd.thyrogendiagnostic.in'");
  console.log('\n--- NGINX /api/v1/settings/general ---');
  console.log(curlNginx.stdout);

  ssh.dispose();
}

testEndpoints().catch(err => {
  console.error(err);
  ssh.dispose();
});
