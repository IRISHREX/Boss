const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to VPS 148.113.6.25:20172...');
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: '8jMA1A_-TsMKEOKd',
    tryKeyboard: true,
    readyTimeout: 30000,
    keepaliveInterval: 10000,
  });
  console.log('✅ Connected to VPS!');

  // 1. Setup 2GB Swapfile
  console.log('\n--- 1. Setting up 2GB Swapfile ---');
  await ssh.execCommand(`
    if [ ! -f /swapfile ]; then
      fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
      chmod 600 /swapfile
      mkswap /swapfile
      swapon /swapfile
      echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi
  `);
  const freeRes = await ssh.execCommand('free -m');
  console.log(freeRes.stdout);

  // 2. Install Essentials & Nginx & Certbot
  console.log('\n--- 2. Installing System Packages (curl, git, nginx, certbot) ---');
  const apt1 = await ssh.execCommand('apt-get update -y && DEBIAN_FRONTEND=noninteractive apt-get install -y curl wget git unzip tar build-essential nginx certbot python3-certbot-nginx gnupg s3cmd');
  console.log('Apt packages installation finished.');

  // 3. Install Node.js 20 LTS & PM2
  console.log('\n--- 3. Installing Node.js 20 LTS & PM2 ---');
  await ssh.execCommand('curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs && npm install -g pm2');
  const nodeVer = await ssh.execCommand('node -v && npm -v && pm2 -v');
  console.log('Node / NPM / PM2 versions:', nodeVer.stdout.trim());

  // 4. Install MongoDB 8.0 on Ubuntu 24.04 Noble
  console.log('\n--- 4. Installing MongoDB 8.0 ---');
  await ssh.execCommand(`
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
    apt-get update -y && DEBIAN_FRONTEND=noninteractive apt-get install -y mongodb-org mongodb-mongosh
    systemctl daemon-reload
    systemctl start mongod
    systemctl enable mongod
  `);
  const mongodStatus = await ssh.execCommand('systemctl is-active mongod && mongod --version | head -n 1');
  console.log('MongoDB status:', mongodStatus.stdout.trim());

  // 5. Setup directories
  console.log('\n--- 5. Preparing directories ---');
  await ssh.execCommand('mkdir -p /root/thyrogen-opd-fe /root/thyrogen-website /root/thyrogen-be /root/db_backups');
  console.log('✅ Directories ready.');

  ssh.dispose();
  console.log('\n🎉 VPS Provisioning Completed Successfully!');
}

run().catch((err) => {
  console.error('Provisioning error:', err);
  if (ssh.isConnected()) ssh.dispose();
  process.exit(1);
});
