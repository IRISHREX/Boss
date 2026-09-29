const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function updateSystemd() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: 'Ml0NqUQECgW2nFDF',
  });

  console.log('1. Pulling latest thyrogen-be (commit 47144b3)...');
  const gitRes = await ssh.execCommand('cd /root/thyrogen-be && git fetch origin main && git reset --hard origin/main');
  console.log(gitRes.stdout);

  console.log('2. Updating /etc/systemd/system/pm2-root.service to wait for mongod & mysql...');
  const sFile = await ssh.execCommand('cat /etc/systemd/system/pm2-root.service');
  let content = sFile.stdout;
  content = content.replace(/After=network\.target.*/, 'After=network.target mongod.service mysql.service\nWants=mongod.service mysql.service');
  
  await ssh.execCommand(`cat << 'EOF' > /etc/systemd/system/pm2-root.service\n${content}\nEOF`);
  await ssh.execCommand('systemctl daemon-reload');
  console.log('✅ Systemd daemon-reload successful!');

  console.log('3. Restarting thyrogen-backend...');
  await ssh.execCommand('pm2 restart thyrogen-backend');

  console.log('4. Checking thyrogen-backend logs...');
  await new Promise(r => setTimeout(r, 3000));
  const logs = await ssh.execCommand('pm2 logs thyrogen-backend --lines 25 --nostream');
  console.log(logs.stdout);

  console.log('5. Verifying PM2 process list...');
  const list = await ssh.execCommand('pm2 list');
  console.log(list.stdout);

  ssh.dispose();
}

updateSystemd().catch(err => {
  console.error(err);
  ssh.dispose();
  process.exit(1);
});
