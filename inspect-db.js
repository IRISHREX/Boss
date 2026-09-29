const { NodeSSH } = require('./aiccloud-deployment/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '148.113.6.25',
    port: 20172,
    username: 'root',
    password: 'Ml0NqUQECgW2nFDF',
  });
  const res = await ssh.execCommand(`node -e "
    const mongoose = require('/root/thyrogen-be/node_modules/mongoose');
    mongoose.connect('mongodb://127.0.0.1:27017/throgendb').then(async () => {
      const caps = await mongoose.connection.db.collection('capacities').find().limit(5).toArray();
      console.log('Sample capacities:', caps);
      const capCount = await mongoose.connection.db.collection('capacities').countDocuments();
      console.log('Capacity count:', capCount);
      const testCount = await mongoose.connection.db.collection('diagnostictests').countDocuments();
      console.log('diagnostictests count:', testCount);
      const sampleTests = await mongoose.connection.db.collection('diagnostictests').find().limit(5).toArray();
      console.log('Sample diagnostictests:', sampleTests);
      process.exit(0);
    });
  "`);
  console.log(res.stdout || res.stderr);
  ssh.dispose();
}

run();
