const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting to VPS 148.113.6.25:20172...');
    await ssh.connect({
      host: '148.113.6.25',
      port: 20172,
      username: 'root',
      password: 'Ml0NqUQECgW2nFDF',
      tryKeyboard: true,
      readyTimeout: 45000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 10,
    });

    const remoteScript = `
const mongoose = require('/root/thyrogen-be/node_modules/mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/throgendb');
  const db = mongoose.connection.db;

  const appts = await db.collection('appointments').find({
    $or: [{ patientId: { $exists: false } }, { patientId: null }]
  }).toArray();

  console.log('Found appointments without patientId:', appts.length);

  for (const appt of appts) {
    const phone = (appt.phone || '').trim();
    const email = (appt.email || '').toLowerCase().trim();
    const nic = (appt.nic || '').trim();

    let patient = null;
    const queries = [];
    if (phone) queries.push({ phone });
    if (email && !email.includes('patient@opd.local') && !email.includes('biomechasoft.com')) {
      queries.push({ email });
    }
    if (nic) queries.push({ nic });

    if (queries.length > 0) {
      patient = await db.collection('users').findOne({
        $or: queries,
        role: 'Patient'
      });
    }

    if (!patient) {
      const rawName = (appt.name || '').trim();
      const parts = rawName.replace(/\\s+/g, ' ').split(' ').filter(Boolean);
      const firstName = parts[0] || 'Patient';
      const lastName = parts.slice(1).join(' ') || '';
      const phoneToUse = phone || ('91' + Date.now().toString().slice(-8));
      const emailToUse = (email && !email.includes('patient@opd.local') && !email.includes('biomechasoft.com'))
        ? email
        : (firstName.toLowerCase() + '.' + phoneToUse.slice(-4) + '@thyrogen.local');
      const nicToUse = nic || phoneToUse.slice(0, 13).padEnd(13, '0');

      const ageVal = appt.age || 30;
      const now = new Date();
      const dobDate = new Date(now.getFullYear() - Number(ageVal), now.getMonth(), now.getDate());

      const newPatientDoc = {
        firstName,
        lastName,
        name: rawName || (firstName + ' ' + lastName).trim(),
        email: emailToUse,
        phone: phoneToUse,
        nic: nicToUse,
        dob: dobDate,
        gender: appt.gender || 'Male',
        password: '$2a$10$wKxN7oG6yPZZ7Xy6qRsmzOz1gXq/i5q6n2e1x.G5y1uP2pQ1rO4uW', // hashed default
        role: 'Patient',
        age: ageVal,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertRes = await db.collection('users').insertOne(newPatientDoc);
      patient = { _id: insertRes.insertedId, ...newPatientDoc };
      console.log('Created new Patient user:', patient._id, patient.name);
    } else {
      console.log('Found existing Patient user:', patient._id, patient.name || (patient.firstName + ' ' + patient.lastName));
    }

    await db.collection('appointments').updateOne(
      { _id: appt._id },
      { $set: { patientId: patient._id } }
    );
    console.log('  -> Updated appointment', appt._id, 'with patientId', patient._id);

    // Also update any matching referral
    const refUpdateRes = await db.collection('referrals').updateMany(
      { appointmentId: appt._id },
      { $set: { patientId: patient._id } }
    );
    if (refUpdateRes.modifiedCount > 0) {
      console.log('  -> Updated', refUpdateRes.modifiedCount, 'associated referral(s)');
    }
  }

  // Verify none remain
  const remaining = await db.collection('appointments').countDocuments({
    $or: [{ patientId: { $exists: false } }, { patientId: null }]
  });
  console.log('\\nVerification: Appointments without patientId remaining:', remaining);

  await mongoose.disconnect();
}

main().catch(console.error);
`;

    const b64 = Buffer.from(remoteScript).toString('base64');
    await ssh.execCommand(`echo "${b64}" | base64 -d > /tmp/retrofit_appts.js`);
    const res = await ssh.execCommand('node /tmp/retrofit_appts.js');
    console.log(res.stdout || res.stderr);
    await ssh.execCommand('rm -f /tmp/retrofit_appts.js');

    ssh.dispose();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
