const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');

const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting to VPS 148.113.6.25:20172...');
    await ssh.connect({
      host: '148.113.6.25',
      port: 20172,
      username: 'root',
      password: '8jMA1A_-TsMKEOKd',
      tryKeyboard: true,
      readyTimeout: 30000,
      keepaliveInterval: 5000,
    });
    console.log('✅ Connected to VPS successfully!\n');

    const commands = [
      'cat /etc/os-release | grep PRETTY_NAME',
      'uname -a',
      'node -v || echo "node not found"',
      'npm -v || echo "npm not found"',
      'pm2 -v || echo "pm2 not found"',
      'nginx -v || echo "nginx not found"',
      'systemctl is-active nginx || echo "nginx not active"',
      'mongod --version || echo "mongod not found"',
      'systemctl is-active mongod || echo "mongod not active"',
      'which certbot || echo "certbot not found"',
      'certbot certificates || echo "no certbot certs"',
      'ls -la /root',
      'df -h /',
      'free -m'
    ];

    for (const cmd of commands) {
      console.log(`=== Command: ${cmd} ===`);
      const res = await ssh.execCommand(cmd);
      console.log(res.stdout || res.stderr);
    }

    ssh.dispose();
  } catch (err) {
    console.error('SSH Error:', err);
    process.exit(1);
  }
}

run();
