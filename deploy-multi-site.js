const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

const VPS_HOST = '148.113.6.25';
const VPS_PORT = 20172;
const VPS_USER = 'root';
const VPS_PASS = 'Ml0NqUQECgW2nFDF';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BMS_OPD_DIST = path.join(PROJECT_ROOT, 'BMS_OPD', 'dist');
const THYROGEN_OUTPUT = path.join(PROJECT_ROOT, 'thyrogen', '.output');

async function main() {
  console.log('========================================================');
  console.log('🚀 Deploying Multi-Domain Infrastructure to aiccloud VPS');
  console.log('   - Website: https://thyrogendiagnostic.in');
  console.log('   - OPD App: https://opd.thyrogendiagnostic.in');
  console.log('   - OPD App: https://opd.biomechasoft.in');
  console.log('========================================================\n');

  // Step 1: Package local bundles
  console.log('📦 Step 1: Creating archive packages for upload...');
  const opdTarPath = path.join(__dirname, 'opd-fe.tar.gz');
  const thyrogenTarPath = path.join(__dirname, 'thyrogen-site.tar.gz');

  if (fs.existsSync(opdTarPath)) fs.unlinkSync(opdTarPath);
  if (fs.existsSync(thyrogenTarPath)) fs.unlinkSync(thyrogenTarPath);

  console.log('  -> Compressing BMS_OPD dist...');
  execSync(`tar -czf "${opdTarPath}" -C "${BMS_OPD_DIST}" .`, { stdio: 'inherit' });
  console.log(`  ✅ BMS_OPD dist compressed (${(fs.statSync(opdTarPath).size / 1024).toFixed(1)} KB)`);

  console.log('  -> Compressing ThyroGen .output...');
  execSync(`tar -czf "${thyrogenTarPath}" -C "${THYROGEN_OUTPUT}" .`, { stdio: 'inherit' });
  console.log(`  ✅ ThyroGen .output compressed (${(fs.statSync(thyrogenTarPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Step 2: Connect via SSH
  console.log('\n🔑 Step 2: Connecting to VPS via SSH (148.113.6.25:20172)...');
  await ssh.connect({
    host: VPS_HOST,
    port: VPS_PORT,
    username: VPS_USER,
    password: VPS_PASS,
    tryKeyboard: true,
  });
  console.log('  ✅ Connected successfully!');

  // Step 3: Prepare remote directories
  console.log('\n📁 Step 3: Preparing remote directories on VPS...');
  await ssh.execCommand('mkdir -p /root/thyrogen-opd-fe /root/BMS-opd-fe /root/thyrogen-website');
  
  // Step 4: Upload archives
  console.log('\n📤 Step 4: Uploading packages to VPS...');
  console.log('  -> Uploading opd-fe.tar.gz...');
  await ssh.putFile(opdTarPath, '/root/opd-fe.tar.gz');
  console.log('  ✅ OPD archive uploaded.');

  console.log('  -> Uploading thyrogen-site.tar.gz...');
  await ssh.putFile(thyrogenTarPath, '/root/thyrogen-site.tar.gz');
  console.log('  ✅ ThyroGen website archive uploaded.');

  // Step 5: Extract packages on VPS
  console.log('\n📂 Step 5: Extracting packages on VPS...');
  console.log('  -> Unpacking OPD frontend to /root/thyrogen-opd-fe and /root/BMS-opd-fe...');
  await ssh.execCommand('tar -xzf /root/opd-fe.tar.gz -C /root/thyrogen-opd-fe');
  await ssh.execCommand('tar -xzf /root/opd-fe.tar.gz -C /root/BMS-opd-fe');
  await ssh.execCommand('chmod -R 755 /root/thyrogen-opd-fe /root/BMS-opd-fe');

  console.log('  -> Unpacking ThyroGen website to /root/thyrogen-website...');
  await ssh.execCommand('rm -rf /root/thyrogen-website/*');
  await ssh.execCommand('tar -xzf /root/thyrogen-site.tar.gz -C /root/thyrogen-website');
  await ssh.execCommand('chmod -R 755 /root/thyrogen-website');

  // Step 6: Start/Restart PM2 process for thyrogen-website SSR server (Port 3002)
  console.log('\n⚙️ Step 6: Managing PM2 processes...');
  const pm2ListRes = await ssh.execCommand('pm2 jlist');
  const pm2List = JSON.parse(pm2ListRes.stdout || '[]');
  const hasWebsiteProcess = pm2List.some((p) => p.name === 'thyrogen-website');

  if (hasWebsiteProcess) {
    console.log('  -> Restarting existing PM2 process "thyrogen-website"...');
    await ssh.execCommand('pm2 restart thyrogen-website --update-env');
  } else {
    console.log('  -> Starting new PM2 process "thyrogen-website" on PORT=3002...');
    await ssh.execCommand('PORT=3002 NODE_ENV=production pm2 start /root/thyrogen-website/server/index.mjs --name thyrogen-website');
  }
  await ssh.execCommand('pm2 save');
  console.log('  ✅ PM2 process active.');

  // Step 7: Update Nginx configuration
  console.log('\n🌐 Step 7: Updating Nginx configuration for all domains...');
  const nginxConfig = `# ============================================================
# opd.biomechasoft.in — OPD Application (Port 5000 / bms-backend)
# ============================================================
server {
    listen 80;
    listen [::]:80;
    server_name opd.biomechasoft.in;

    client_max_body_size 50M;

    root /root/BMS-opd-fe;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}

# ============================================================
# opd.thyrogendiagnostic.in — ThyroGen OPD Application (Port 5001 / throgendb)
# ============================================================
server {
    listen 80;
    listen [::]:80;
    server_name opd.thyrogendiagnostic.in;

    client_max_body_size 50M;

    root /root/thyrogen-opd-fe;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

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

# ============================================================
# thyrogendiagnostic.in — ThyroGen Website (SSR Port 3002 + Public API Port 5001)
# ============================================================
server {
    listen 80;
    listen [::]:80;
    server_name thyrogendiagnostic.in www.thyrogendiagnostic.in;

    client_max_body_size 50M;

    # Static assets serving
    location /assets {
        alias /root/thyrogen-website/public/assets;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /favicon.ico {
        alias /root/thyrogen-website/public/favicon.ico;
    }

    location /favicon.svg {
        alias /root/thyrogen-website/public/favicon.svg;
    }

    location /robots.txt {
        alias /root/thyrogen-website/public/robots.txt;
    }

    # Public OPD backend API & uploads bridge
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

    # SSR Website application proxy
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ============================================================
# biomechasoft.in — Main Domain 301 Redirect
# ============================================================
server {
    listen 80;
    listen [::]:80;
    server_name biomechasoft.in www.biomechasoft.in;

    return 301 https://opd.biomechasoft.in$request_uri;
}
`;

  // Write remote Nginx config
  await ssh.execCommand(`cat << 'EOF' > /etc/nginx/sites-available/default\n${nginxConfig}\nEOF`);
  console.log('  ✅ /etc/nginx/sites-available/default written.');

  // Validate and reload Nginx
  const testRes = await ssh.execCommand('nginx -t');
  console.log('  -> Nginx test output:', testRes.stderr || testRes.stdout);
  if (testRes.code !== 0) {
    throw new Error('Nginx configuration test failed!');
  }

  await ssh.execCommand('systemctl reload nginx');
  console.log('  ✅ Nginx reloaded successfully.');

  // Step 8: Clean up temporary files
  await ssh.execCommand('rm -f /root/opd-fe.tar.gz /root/thyrogen-site.tar.gz');
  if (fs.existsSync(opdTarPath)) fs.unlinkSync(opdTarPath);
  if (fs.existsSync(thyrogenTarPath)) fs.unlinkSync(thyrogenTarPath);

  // Step 9: Final status verification
  console.log('\n📊 Step 9: Verifying PM2 & Services Status...');
  const pm2StatusRes = await ssh.execCommand('pm2 status');
  console.log(pm2StatusRes.stdout);

  console.log('\n🎉 ========================================================');
  console.log('✅ ALL DEPLOYMENTS COMPLETED SUCCESSFULLY!');
  console.log('   - https://thyrogendiagnostic.in (Website live)');
  console.log('   - https://opd.thyrogendiagnostic.in (OPD app live)');
  console.log('   - https://opd.biomechasoft.in (BMS OPD app live)');
  console.log('========================================================\n');

  ssh.dispose();
}

main().catch((err) => {
  console.error('\n❌ Deployment Failed:', err);
  ssh.dispose();
  process.exit(1);
});
