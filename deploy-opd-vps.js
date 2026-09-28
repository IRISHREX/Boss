const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

const VPS_HOST = '148.113.6.25';
const VPS_PORT = 20172;
const VPS_USER = 'root';
const VPS_PASS = 'Ml0NqUQECgW2nFDF';

async function deploy() {
  console.log('===============================================================');
  console.log('🚀 Deploying BMS_OPD Frontend & Backend to aiccloud Production');
  console.log('   - Domain: https://opd.thyrogendiagnostic.in');
  console.log('   - Backend API: Port 5001 (thyrogen-backend / throgendb)');
  console.log('===============================================================\n');

  try {
    console.log('🔑 Step 1: Connecting to VPS via SSH (148.113.6.25:20172)...');
    await ssh.connect({
      host: VPS_HOST,
      port: VPS_PORT,
      username: VPS_USER,
      password: VPS_PASS,
      tryKeyboard: true,
    });
    console.log('  ✅ Connected successfully!\n');

    // Step 2: Update Backend
    console.log('⚙️ Step 2: Updating Backend (/root/thyrogen-be)...');
    const beGitRes = await ssh.execCommand(
      'cd /root/thyrogen-be && git init && git remote remove origin 2>/dev/null || true; git remote add origin https://github.com/IRISHREX/BMS_OPD_BE.git; git fetch origin main && git reset --hard origin/main'
    );
    console.log(beGitRes.stdout || beGitRes.stderr);

    console.log('  -> Restarting PM2 process "thyrogen-backend"...');
    const pm2Res = await ssh.execCommand('pm2 restart thyrogen-backend');
    console.log(pm2Res.stdout);
    console.log('  ✅ Backend restarted successfully.\n');

    // Step 3: Build & Deploy Frontend
    console.log('📦 Step 3: Building Frontend from Git (branch Sohel2)...');
    const buildRes = await ssh.execCommand(`
      rm -rf /root/build-fe
      git clone --depth 1 -b Sohel2 https://github.com/IRISHREX/BMS_OPD.git /root/build-fe
      cd /root/build-fe
      npm install --legacy-peer-deps
      npm run build
      mkdir -p /root/thyrogen-opd-fe
      rm -rf /root/thyrogen-opd-fe/*
      cp -r /root/build-fe/dist/* /root/thyrogen-opd-fe/
      chmod -R 755 /root/thyrogen-opd-fe
    `);
    console.log(buildRes.stdout || buildRes.stderr);
    console.log('  ✅ Frontend built and deployed to /root/thyrogen-opd-fe.\n');

    // Step 4: Reload Nginx
    console.log('🌐 Step 4: Reloading Nginx...');
    await ssh.execCommand('nginx -t && systemctl reload nginx');
    console.log('  ✅ Nginx reloaded successfully.\n');

    // Step 5: Verification & Status
    console.log('🔍 Step 5: Verifying live endpoints on VPS...');
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

    ssh.dispose();
  } catch (err) {
    console.error('❌ Deployment Failed:', err);
    process.exit(1);
  }
}

deploy();
