const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: '8jMA1A_-TsMKEOKd',
    tryKeyboard: true,
  });

  console.log('=== PM2 PROCESS STATUS ===');
  const pm2 = await ssh.execCommand('pm2 status');
  console.log(pm2.stdout);

  console.log('=== MEMORY & DISK USAGE ===');
  const mem = await ssh.execCommand('free -m && df -h /');
  console.log(mem.stdout);

  console.log('=== DATABASE STATS ===');
  const db = await ssh.execCommand(`mongosh throgendb --quiet --eval "print('Total collections: ' + db.getCollectionNames().length + ' | Advices: ' + db.medicaladvices.countDocuments() + ' | Tests: ' + db.diagnostictests.countDocuments() + ' | Meds: ' + db.medicines.countDocuments() + ' | Users: ' + db.users.countDocuments())"`);
  console.log(db.stdout.trim());

  console.log('=== INTERNAL & EXTERNAL ENDPOINTS CHECK ===');
  const tests = [
    'curl -Is https://thyrogendiagnostic.in | head -n 3',
    'curl -Is https://thyrogendiagnostic.in/doctors | head -n 3',
    'curl -Is https://thyrogendiagnostic.in/tests | head -n 3',
    'curl -Is https://opd.thyrogendiagnostic.in | head -n 3',
    'curl -s https://opd.thyrogendiagnostic.in/api/v1/medical/suggestions/symptoms | head -c 120',
    'curl -s https://opd.thyrogendiagnostic.in/api/v1/user/doctors | head -c 120',
  ];

  for (const t of tests) {
    console.log(`\n> ${t}`);
    const res = await ssh.execCommand(t);
    console.log(res.stdout || res.stderr);
  }

  ssh.dispose();
  console.log('\n✅ All checks finished!');
}

run().catch(console.error);
