const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: 'Ml0NqUQECgW2nFDF',
  });
  console.log('--- Checking local MongoDB connection and users in throgendb ---');
  const res = await ssh.execCommand(`node -e "
    const mongoose = require('/root/thyrogen-be/node_modules/mongoose');
    mongoose.connect('mongodb://127.0.0.1:27017/throgendb').then(async () => {
      console.log('Successfully connected to local 127.0.0.1:27017/throgendb!');
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log('User count in local throgendb:', userCount);
      const users = await mongoose.connection.db.collection('users').find({}, { projection: { email: 1, role: 1, firstName: 1 } }).toArray();
      console.log('Users in local throgendb:', users);
      process.exit(0);
    }).catch(err => {
      console.error('Local Mongo error:', err.message);
      process.exit(1);
    });
  "`);
  console.log(res.stdout || res.stderr);

  console.log('--- pm2 env 0 ---');
  const env0 = await ssh.execCommand("pm2 env 0");
  const lines = env0.stdout.split('\n').filter(l => l.includes('PORT') || l.includes('MONGO') || l.includes('DB_NAME'));
  console.log(lines.join('\n'));

  ssh.dispose();
}

run();
