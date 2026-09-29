const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to VPS 148.113.6.25:20172...');
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: 'Ml0NqUQECgW2nFDF',
  });
  console.log('Connected! Fetching existing tests and medicines...');

  // Step 1: Export tests and medicines to local JSON to build accurate references
  const extractScript = `
    const mongoose = require('/root/thyrogen-be/node_modules/mongoose');
    const fs = require('fs');
    mongoose.connect('mongodb://127.0.0.1:27017/throgendb').then(async () => {
      const tests = await mongoose.connection.db.collection('diagnostictests').find({}, { projection: { name: 1, department: 1, price: 1 } }).toArray();
      const meds = await mongoose.connection.db.collection('medicines').find({}, { projection: { name: 1, type: 1, dose: 1, frequency: 1 } }).toArray();
      const existingAdv = await mongoose.connection.db.collection('medicaladvices').find({}, { projection: { name: 1 } }).toArray();
      fs.writeFileSync('/tmp/tests.json', JSON.stringify(tests));
      fs.writeFileSync('/tmp/meds.json', JSON.stringify(meds));
      fs.writeFileSync('/tmp/existingAdv.json', JSON.stringify(existingAdv));
      console.log('Exported:', tests.length, 'tests,', meds.length, 'medicines,', existingAdv.length, 'advices');
      process.exit(0);
    });
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/extract.js\n${extractScript}\nEOF`);
  const res = await ssh.execCommand('node /tmp/extract.js');
  console.log(res.stdout);

  // Download them to inspect
  await ssh.getFile(path.join(__dirname, 'scratch_tests.json'), '/tmp/tests.json');
  await ssh.getFile(path.join(__dirname, 'scratch_meds.json'), '/tmp/meds.json');
  await ssh.getFile(path.join(__dirname, 'scratch_adv.json'), '/tmp/existingAdv.json');

  console.log('Downloaded tests and medicines summaries locally.');
  ssh.dispose();
}

run();
