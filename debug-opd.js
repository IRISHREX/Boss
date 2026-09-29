const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: '8jMA1A_-TsMKEOKd',
    tryKeyboard: true,
  });

  console.log('Fixing /root permissions to 755...');
  await ssh.execCommand('chmod 755 /root && chmod -R 755 /root/thyrogen-opd-fe /root/thyrogen-website');

  console.log('--- Nginx curl direct to 127.0.0.1:80 for opd.thyrogendiagnostic.in ---');
  const curl = await ssh.execCommand("curl -Is http://127.0.0.1 -H 'Host: opd.thyrogendiagnostic.in'");
  console.log(curl.stdout);

  console.log('--- External HTTPS curl to opd.thyrogendiagnostic.in ---');
  const curlExt = await ssh.execCommand("curl -Is https://opd.thyrogendiagnostic.in");
  console.log(curlExt.stdout);

  console.log('--- External HTTPS curl to thyrogendiagnostic.in ---');
  const curlWeb = await ssh.execCommand("curl -Is https://thyrogendiagnostic.in");
  console.log(curlWeb.stdout);

  ssh.dispose();
}

run().catch(console.error);
