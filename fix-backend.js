const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function killHeavy() {
  let connected = false;
  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`Attempting SSH connection (${i}/5)...`);
      await ssh.connect({
        host: '148.113.6.25',
        port: 20172,
        username: 'root',
        password: 'Ml0NqUQECgW2nFDF',
        tryKeyboard: true,
      });
      connected = true;
      console.log('✅ Connected successfully!');
      break;
    } catch (e) {
      console.warn(`Connection attempt ${i} failed: ${e.message}`);
      if (i < 5) await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (!connected) throw new Error('Failed to connect after 5 attempts');

  console.log('1. Killing stuck tsc, npm install, npm run build, and tsx processes...');
  await ssh.execCommand('pkill -9 -f tsc || true');
  await ssh.execCommand('pkill -9 -f "npm" || true');
  await ssh.execCommand('pkill -9 -f tsx || true');
  await ssh.execCommand('pkill -9 -f esbuild || true');

  console.log('2. Checking memory after kill...');
  await new Promise(r => setTimeout(r, 2000));
  const mem = await ssh.execCommand('free -m && uptime');
  console.log(mem.stdout);

  console.log('3. Checking PM2 status...');
  const pm2 = await ssh.execCommand('pm2 list');
  console.log(pm2.stdout);

  console.log('4. Checking listening ports...');
  const ports = await ssh.execCommand('netstat -tulnp');
  console.log(ports.stdout);

  ssh.dispose();
}

killHeavy().catch(err => {
  console.error(err);
  ssh.dispose();
  process.exit(1);
});
