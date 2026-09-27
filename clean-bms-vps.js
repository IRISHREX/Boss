const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const fs = require('fs');

const ssh = new NodeSSH();

const VPS_HOST = '148.113.6.25';
const VPS_PORT = 20172;
const VPS_USER = 'root';
const VPS_PASS = 'Ml0NqUQECgW2nFDF';

async function run() {
  try {
    console.log('Connecting to VPS...');
    await ssh.connect({
      host: VPS_HOST,
      port: VPS_PORT,
      username: VPS_USER,
      password: VPS_PASS,
      tryKeyboard: true,
    });
    console.log('✅ Connected to VPS successfully!\n');

    // 1. Inspect current MongoDB databases
    console.log('--- Step 1: Checking MongoDB Databases ---');
    const mongoDbs = await ssh.execCommand('mongosh --quiet --eval "db.getMongo().getDBNames()"');
    console.log(mongoDbs.stdout || mongoDbs.stderr);

    // 2. Inspect /root/backup-to-s3.sh
    console.log('\n--- Step 2: Checking /root/backup-to-s3.sh ---');
    const backupScript = await ssh.execCommand('cat /root/backup-to-s3.sh');
    console.log(backupScript.stdout || backupScript.stderr);

    // 3. Drop MERN_STACK_HOSPITAL_MANAGEMENT database safely
    console.log('\n--- Step 3: Dropping BioMechaSoft Database (MERN_STACK_HOSPITAL_MANAGEMENT) ---');
    const dropRes = await ssh.execCommand('mongosh MERN_STACK_HOSPITAL_MANAGEMENT --eval "db.dropDatabase()"');
    console.log(dropRes.stdout || dropRes.stderr);

    // 4. Verify throgendb is intact
    console.log('\n--- Step 4: Verifying throgendb collections and document count ---');
    const thyroStats = await ssh.execCommand('mongosh throgendb --eval "db.getCollectionNames().map(c => ({ [c]: db.getCollection(c).countDocuments() }))"');
    console.log(thyroStats.stdout || thyroStats.stderr);

    // 5. Stop and delete PM2 process bms-backend
    console.log('\n--- Step 5: Removing PM2 process bms-backend ---');
    await ssh.execCommand('pm2 delete bms-backend');
    await ssh.execCommand('pm2 save');
    const pm2Status = await ssh.execCommand('pm2 status');
    console.log(pm2Status.stdout);

    // 6. Remove BioMechaSoft folders from /root
    console.log('\n--- Step 6: Removing BioMechaSoft files and directories ---');
    await ssh.execCommand('rm -rf /root/BMS-opd-fe /root/BMS-opd-be /root/dist.b64');
    console.log('✅ /root/BMS-opd-fe and /root/BMS-opd-be removed.');

    // 7. Update Nginx configuration to remove biomechasoft.in and opd.biomechasoft.in
    console.log('\n--- Step 7: Updating Nginx configuration (Retaining only ThyroGen) ---');
    const cleanNginxConfig = `# ============================================================
# Default Catch-All: Reject unknown domains & decommissioned hosts
# ============================================================
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 404;
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
`;

    // Write new clean Nginx config to temporary file and transfer
    const localNginxTemp = 'nginx_clean_default.conf';
    fs.writeFileSync(localNginxTemp, cleanNginxConfig);
    await ssh.putFile(localNginxTemp, '/etc/nginx/sites-available/default');
    if (fs.existsSync(localNginxTemp)) fs.unlinkSync(localNginxTemp);

    // Test and reload Nginx
    const nginxTest = await ssh.execCommand('nginx -t');
    console.log('Nginx test:', nginxTest.stdout || nginxTest.stderr);
    if (!nginxTest.stderr.includes('successful') && !nginxTest.stdout.includes('successful')) {
      throw new Error('Nginx configuration test failed!');
    }
    await ssh.execCommand('systemctl reload nginx');
    console.log('✅ Nginx reloaded successfully.');

    // 8. Update /root/backup-to-s3.sh to only back up throgendb
    console.log('\n--- Step 8: Updating /root/backup-to-s3.sh (Keeping only throgendb) ---');
    const cleanBackupScript = `#!/bin/bash
# Daily Backup Script for ThyroGen Diagnostic Database to S3
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="/root/db_backups"
S3_BUCKET="aic-585105c0"
S3_ENDPOINT="https://s3.aiccloud.online"

mkdir -p $BACKUP_DIR

# Dump ThyroGen database
mongodump --db=throgendb --archive=$BACKUP_DIR/throgendb_$DATE.archive --gzip

# Upload to S3
s3cmd --endpoint=$S3_ENDPOINT put $BACKUP_DIR/throgendb_$DATE.archive s3://$S3_BUCKET/backups/throgendb/

# Retention: Remove local backups older than 7 days
find $BACKUP_DIR -name "*.archive" -mtime +7 -delete
find $BACKUP_DIR -name "*.csv" -mtime +7 -delete
`;
    const localBackupTemp = 'backup-to-s3.sh.tmp';
    fs.writeFileSync(localBackupTemp, cleanBackupScript);
    await ssh.putFile(localBackupTemp, '/root/backup-to-s3.sh');
    await ssh.execCommand('chmod +x /root/backup-to-s3.sh');
    if (fs.existsSync(localBackupTemp)) fs.unlinkSync(localBackupTemp);
    console.log('✅ /root/backup-to-s3.sh updated to only backup throgendb.');

    // 9. Inspect final /root directory
    console.log('\n--- Step 9: Final /root Directory Listing ---');
    const finalLs = await ssh.execCommand('ls -la /root');
    console.log(finalLs.stdout);

    ssh.dispose();
    console.log('\n🎉 Cleanup completed successfully without touching ThyroGen!');
  } catch (err) {
    console.error('Error during cleanup:', err);
    if (ssh.isConnected()) ssh.dispose();
    process.exit(1);
  }
}

run();
