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
const THYROGEN_OUTPUT = path.join(PROJECT_ROOT, 'thyrogen', '.output');

async function main() {
  console.log('🚀 Deploying updated ThyroGen website to aiccloud VPS...');

  const thyrogenTarPath = path.join(__dirname, 'thyrogen-site.tar.gz');
  if (fs.existsSync(thyrogenTarPath)) fs.unlinkSync(thyrogenTarPath);

  console.log('📦 Compressing ThyroGen .output bundle...');
  execSync(`tar -czf "${thyrogenTarPath}" -C "${THYROGEN_OUTPUT}" .`, { stdio: 'inherit' });
  console.log(`✅ Compressed (${(fs.statSync(thyrogenTarPath).size / 1024 / 1024).toFixed(2)} MB)`);

  console.log('🔑 Connecting to VPS via SSH...');
  await ssh.connect({
    host: VPS_HOST,
    port: VPS_PORT,
    username: VPS_USER,
    password: VPS_PASS,
    tryKeyboard: true,
  });

  console.log('📤 Uploading thyrogen-site.tar.gz to VPS...');
  await ssh.putFile(thyrogenTarPath, '/root/thyrogen-site.tar.gz');

  console.log('📂 Unpacking on VPS to /root/thyrogen-website...');
  await ssh.execCommand('mkdir -p /root/thyrogen-website');
  await ssh.execCommand('tar -xzf /root/thyrogen-site.tar.gz -C /root/thyrogen-website');
  await ssh.execCommand('rm -f /root/thyrogen-site.tar.gz');

  console.log('📝 Setting up .env on VPS with ADMIN_OTP_EMAIL=biomechasoft@gmail.com...');
  const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://yxjfkzdaxlmwleantasf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ZazjusLChfbWr9Ru2B0scQ_DF2zfvuP
VITE_SUPABASE_URL=https://yxjfkzdaxlmwleantasf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ZazjusLChfbWr9Ru2B0scQ_DF2zfvuP
ADMIN_OTP_EMAIL=biomechasoft@gmail.com
VITE_ADMIN_OTP_EMAIL=biomechasoft@gmail.com
`;
  await ssh.execCommand(`cat << 'EOF' > /root/thyrogen-website/.env\n${envContent}EOF`);

  console.log('🔄 Restarting PM2 process thyrogen-website...');
  await ssh.execCommand('pm2 restart thyrogen-website');

  console.log('📊 Checking PM2 status...');
  const pm2Res = await ssh.execCommand('pm2 status');
  console.log(pm2Res.stdout);

  if (fs.existsSync(thyrogenTarPath)) fs.unlinkSync(thyrogenTarPath);

  ssh.dispose();
  console.log('🎉 ThyroGen Website deployed live successfully!');
}

main().catch((err) => {
  console.error('Deployment error:', err);
  const thyrogenTarPath = path.join(__dirname, 'thyrogen-site.tar.gz');
  if (fs.existsSync(thyrogenTarPath)) fs.unlinkSync(thyrogenTarPath);
  if (ssh.isConnected()) ssh.dispose();
  process.exit(1);
});
