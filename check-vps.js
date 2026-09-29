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
      readyTimeout: 120000,
      keepaliveInterval: 5000,
      keepaliveCountMax: 10,
    });
    console.log('✅ Connected to VPS successfully!\n');

    console.log('--- caddy status ---');
    const caddy = await ssh.execCommand('which caddy || echo "no caddy"');
    console.log(caddy.stdout);
    const caddyPs = await ssh.execCommand('ps aux | grep -i caddy');
    console.log(caddyPs.stdout);

    console.log('--- curl to biomechasoft.in directly to 127.0.0.1:80 ---');
    const curlLocal = await ssh.execCommand("curl -Is http://127.0.0.1 -H 'Host: biomechasoft.in'");
    console.log(curlLocal.stdout);

    console.log('--- curl to biomechasoft.in:5000 ---');
    const curl5000 = await ssh.execCommand("curl -Is http://127.0.0.1:5000 -H 'Host: biomechasoft.in'");
    console.log(curl5000.stdout);

    console.log('--- curl to biomechasoft.in:3000 ---');
    const curl3000 = await ssh.execCommand("curl -Is http://127.0.0.1:3000 -H 'Host: biomechasoft.in'");
    console.log(curl3000.stdout);

    console.log('--- curl to opd.biomechasoft.in on 127.0.0.1:80 ---');
    const curlOpdB = await ssh.execCommand("curl -Is http://127.0.0.1 -H 'Host: opd.biomechasoft.in'");
    console.log(curlOpdB.stdout);

    console.log('--- curl to opd.biomechasoft.in:5000 ---');
    const curlOpdB5000 = await ssh.execCommand("curl -Is http://127.0.0.1:5000 -H 'Host: opd.biomechasoft.in'");
    console.log(curlOpdB5000.stdout);

    console.log('--- DNS resolution on VPS ---');
    const dns = await ssh.execCommand("nslookup biomechasoft.in && nslookup opd.biomechasoft.in");
    console.log(dns.stdout);

    ssh.dispose();
  } catch (err) {
    console.error('SSH Error:', err);
    process.exit(1);
  }
}

run();
