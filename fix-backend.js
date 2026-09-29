const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function fix() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: 'Ml0NqUQECgW2nFDF',
  });

  console.log('1. Pulling latest thyrogen-be from origin/main...');
  const gitRes = await ssh.execCommand('cd /root/thyrogen-be && git fetch origin main && git reset --hard origin/main');
  console.log(gitRes.stdout);

  console.log('2. Updating /root/thyrogen-be/.env to explicitly use throgendb...');
  await ssh.execCommand("sed -i 's|mongodb://127.0.0.1:27017/MERN_STACK_HOSPITAL_MANAGEMENT|mongodb://127.0.0.1:27017/throgendb|g' /root/thyrogen-be/.env");
  await ssh.execCommand("grep -q 'DB_NAME=' /root/thyrogen-be/.env || echo 'DB_NAME=throgendb' >> /root/thyrogen-be/.env");

  console.log('3. Restarting thyrogen-backend...');
  await ssh.execCommand('pm2 restart thyrogen-backend');

  console.log('4. Configuring Nginx biomechasoft.conf with separate blocks...');
  const newBiomechaConf = `# ============================================================
# biomechasoft.in (Clinic-Logic Lab Application - Port 5002)
# ============================================================
server {
    listen 80;
    listen [::]:80;
    listen 3000;
    listen [::]:3000;
    listen 5000;
    listen [::]:5000;
    server_name biomechasoft.in www.biomechasoft.in;

    root /var/www/biomechasoft;
    index index.html;

    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy bridge to Port 5002 (Clinic-Logic Backend)
    location /api {
        proxy_pass http://127.0.0.1:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}

# ============================================================
# opd.biomechasoft.in (ThyroGen OPD Application - Port 5001)
# ============================================================
server {
    listen 80;
    listen [::]:80;
    listen 3000;
    listen [::]:3000;
    listen 5000;
    listen [::]:5000;
    server_name opd.biomechasoft.in;

    root /root/thyrogen-opd-fe;
    index index.html;

    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy bridge to Port 5001 (OPD Backend)
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
`;

  await ssh.execCommand(`cat << 'EOF' > /etc/nginx/sites-available/biomechasoft.conf\n${newBiomechaConf}\nEOF`);

  console.log('5. Cleaning legacy block from /etc/nginx/sites-available/default...');
  const currentDef = (await ssh.execCommand('cat /etc/nginx/sites-available/default')).stdout;
  const cleanedDef = currentDef.replace(/server\s*\{[\s\S]*?proxy_pass\s+http:\/\/127\.0\.0\.1:5000;[\s\S]*?\}\s*\}/, '');
  await ssh.execCommand(`cat << 'EOF' > /etc/nginx/sites-available/default\n${cleanedDef}\nEOF`);

  console.log('6. Testing and reloading Nginx...');
  const ngTest = await ssh.execCommand('nginx -t && systemctl reload nginx');
  console.log(ngTest.stdout || ngTest.stderr);

  console.log('7. Verifying thyrogen-backend logs...');
  await new Promise(r => setTimeout(r, 2000));
  const pm2Log = await ssh.execCommand('pm2 logs thyrogen-backend --lines 20 --nostream');
  console.log(pm2Log.stdout);

  console.log('8. Verifying PM2 process list...');
  const pm2List = await ssh.execCommand('pm2 list');
  console.log(pm2List.stdout);

  console.log('9. Checking swap space...');
  const swapCheck = await ssh.execCommand('swapon --show');
  console.log(swapCheck.stdout);
  if (!swapCheck.stdout.includes('/swapfile')) {
    console.log('Creating 1GB swapfile to prevent memory starvation...');
    await ssh.execCommand('fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && (grep -q "/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab)');
    console.log('Swap created successfully!');
    const newSwap = await ssh.execCommand('free -m');
    console.log(newSwap.stdout);
  }

  ssh.dispose();
}

fix().catch(err => {
  console.error(err);
  ssh.dispose();
  process.exit(1);
});
