const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

// Load local extracts
const allTests = JSON.parse(fs.readFileSync(path.join(__dirname, 'scratch_tests.json'), 'utf8'));
const allMeds = JSON.parse(fs.readFileSync(path.join(__dirname, 'scratch_meds.json'), 'utf8'));
const existingAdv = JSON.parse(fs.readFileSync(path.join(__dirname, 'scratch_adv.json'), 'utf8'));

console.log(`Loaded ${allTests.length} tests and ${allMeds.length} medicines. Existing advices: ${existingAdv.length}`);

// Helper to find tests by regex
function findTest(regex, fallback) {
  const t = allTests.find(item => regex.test(item.name));
  return t ? t.name : fallback;
}

// Helper to find medicines by regex
function findMed(regex, fallback) {
  const m = allMeds.find(item => regex.test(item.name));
  return m ? m.name : fallback;
}

// Generate the 400+ catalogs in an isolated JSON file
const generateCatalog = require('./catalog-data-builder');
const catalogRecords = generateCatalog(allTests, allMeds, existingAdv);

console.log(`Generated ${catalogRecords.length} comprehensive medical advice protocols!`);

// Save to JSON
fs.writeFileSync(path.join(__dirname, 'seed_catalog_payload.json'), JSON.stringify(catalogRecords, null, 2));
console.log('Saved payload to seed_catalog_payload.json');

async function deployToDb() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: '8jMA1A_-TsMKEOKd',
  });
  console.log('Connected to VPS. Uploading payload...');

  await ssh.putFile(path.join(__dirname, 'seed_catalog_payload.json'), '/tmp/seed_catalog_payload.json');
  console.log('Uploaded payload. Executing MongoDB insertion in throgendb...');

  const insertScript = `
    const mongoose = require('/root/thyrogen-be/node_modules/mongoose');
    const fs = require('fs');
    mongoose.connect('mongodb://127.0.0.1:27017/throgendb').then(async () => {
      const records = JSON.parse(fs.readFileSync('/tmp/seed_catalog_payload.json', 'utf8'));
      console.log('Read records:', records.length);
      const col = mongoose.connection.db.collection('medicaladvices');
      
      let inserted = 0;
      let updated = 0;
      for (const rec of records) {
        const res = await col.updateOne(
          { name: rec.name },
          { $set: rec },
          { upsert: true }
        );
        if (res.upsertedCount > 0) inserted++;
        else if (res.modifiedCount > 0) updated++;
      }
      console.log('Insertion completed. Inserted:', inserted, 'Updated:', updated);
      const totalCount = await col.countDocuments();
      console.log('TOTAL records in medicaladvices now:', totalCount);
      process.exit(0);
    });
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/insert_catalog.js\n${insertScript}\nEOF`);
  const res = await ssh.execCommand('node /tmp/insert_catalog.js');
  console.log(res.stdout || res.stderr);

  ssh.dispose();
}

deployToDb();
