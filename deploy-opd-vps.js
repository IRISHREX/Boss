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
const FE_DIST = fs.existsSync(path.join(PROJECT_ROOT, 'BMS-opd-fe', 'dist'))
  ? path.join(PROJECT_ROOT, 'BMS-opd-fe', 'dist')
  : path.join(PROJECT_ROOT, 'BMS_OPD', 'dist');

async function deploy() {
  console.log('===============================================================');
  console.log('🚀 Deploying BMS_OPD Frontend & Backend to aiccloud Production');
  console.log('   - Domain: https://opd.thyrogendiagnostic.in');
  console.log('   - Backend API: Port 5001 (thyrogen-backend / throgendb)');
  console.log('===============================================================\n');

  const feTarPath = path.join(__dirname, 'opd-fe.tar.gz');
  if (fs.existsSync(feTarPath)) fs.unlinkSync(feTarPath);

  try {
    console.log('📦 Step 1: Compressing local frontend build bundle (BMS_OPD/dist)...');
    execSync(`tar -czf "${feTarPath}" -C "${FE_DIST}" .`, { stdio: 'inherit' });
    console.log(`  ✅ Compressed (${(fs.statSync(feTarPath).size / 1024 / 1024).toFixed(2)} MB)\n`);

    console.log('🔑 Step 2: Connecting to VPS via SSH (148.113.6.25:20172)...');
    await ssh.connect({
      host: VPS_HOST,
      port: VPS_PORT,
      username: VPS_USER,
      password: VPS_PASS,
      tryKeyboard: true,
      readyTimeout: 30000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 10,
    });
    console.log('  ✅ Connected successfully!\n');

    // Step 3: Update Backend
    console.log('⚙️ Step 3: Updating Backend (/root/thyrogen-be)...');
    const beGitRes = await ssh.execCommand(
      'cd /root/thyrogen-be && git fetch origin main && git reset --hard origin/main'
    );
    console.log(beGitRes.stdout || beGitRes.stderr);

    console.log('  -> Restarting PM2 process "thyrogen-backend"...');
    const pm2Res = await ssh.execCommand('pm2 restart thyrogen-backend');
    console.log(pm2Res.stdout);
    console.log('  ✅ Backend restarted successfully.\n');

    // Step 4: Deploy Frontend
    console.log('📤 Step 4: Uploading and deploying Frontend to /root/thyrogen-opd-fe...');
    await ssh.putFile(feTarPath, '/root/opd-fe.tar.gz');
    await ssh.execCommand('mkdir -p /root/thyrogen-opd-fe && rm -rf /root/thyrogen-opd-fe/* && tar -xzf /root/opd-fe.tar.gz -C /root/thyrogen-opd-fe && rm -f /root/opd-fe.tar.gz && chmod -R 755 /root/thyrogen-opd-fe');
    console.log('  ✅ Frontend unpacked and permissions set to 755.\n');

    // Step 5: Reload Nginx
    console.log('🌐 Step 5: Reloading Nginx...');
    await ssh.execCommand('nginx -t && systemctl reload nginx');
    console.log('  ✅ Nginx reloaded successfully.\n');

    // Step 6: Verification & Status
    console.log('🔍 Step 6: Verifying live endpoints on VPS...');
    const curlOpd = await ssh.execCommand('curl -Is http://127.0.0.1 -H "Host: opd.thyrogendiagnostic.in" | head -n 5');
    console.log('--- OPD Web App Header ---');
    console.log(curlOpd.stdout);

    const curlApi = await ssh.execCommand('curl -s http://127.0.0.1:5001/api/v1/medical/suggestions/symptoms | head -c 200');
    console.log('--- Backend Medical API Check ---');
    console.log(curlApi.stdout);

    console.log('\n===============================================================');
    console.log('🎉 DEPLOYMENT COMPLETE! All changes are live at:');
    console.log('👉 https://opd.thyrogendiagnostic.in');
    console.log('===============================================================');

    if (fs.existsSync(feTarPath)) fs.unlinkSync(feTarPath);
    ssh.dispose();
  } catch (err) {
    console.error('❌ Deployment Failed:', err);
    if (fs.existsSync(feTarPath)) fs.unlinkSync(feTarPath);
    if (ssh.isConnected()) ssh.dispose();
    process.exit(1);
  }
}

deploy();
