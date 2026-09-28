const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');

const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting to VPS 148.113.6.25:20172...');
    await ssh.connect({
      host: '148.113.6.25',
      port: 20172,
      username: 'root',
      password: 'Ml0NqUQECgW2nFDF',
      tryKeyboard: true,
      readyTimeout: 120000,
      keepaliveInterval: 5000,
      keepaliveCountMax: 10,
    });
    console.log('✅ Connected to VPS successfully!\n');

    console.log('--- PM2 Status ---');
    const pm2Res = await ssh.execCommand('pm2 status');
    console.log(pm2Res.stdout);

    console.log('--- Current Nginx Configuration ---');
    const nginxRes = await ssh.execCommand('cat /etc/nginx/sites-available/default');
    console.log(nginxRes.stdout);

    console.log('--- Root Directories ---');
    const lsRes = await ssh.execCommand('ls -la /root');
    console.log(lsRes.stdout);

    ssh.dispose();
  } catch (err) {
    console.error('SSH Error:', err);
    process.exit(1);
  }
}

run();
