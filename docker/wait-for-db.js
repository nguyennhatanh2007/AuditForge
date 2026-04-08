const net = require('node:net');

const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || 3306);
const timeoutMs = 2000;
const deadlineMs = 120000;

function attemptConnect() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('timeout'));
    }, timeoutMs);

    socket.on('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve();
    });

    socket.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function waitForDb() {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    try {
      await attemptConnect();
      console.log(`Database reachable at ${host}:${port}`);
      return;
    } catch (error) {
      process.stdout.write('.');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error(`Timed out waiting for database at ${host}:${port}`);
}

waitForDb().catch((error) => {
  console.error(error.message);
  process.exit(1);
});