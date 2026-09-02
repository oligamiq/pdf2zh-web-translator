import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port: 0 }, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Failed to allocate an E2E port'));
        return;
      }
      const { port } = address;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

const port = process.env.E2E_PORT || String(await findFreePort());
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));

const child = spawn(
  process.execPath,
  [playwrightCli, 'test', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, E2E_PORT: port },
  },
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

const exitCode = await new Promise((resolve) => {
  child.once('exit', (code, signal) => {
    if (signal) {
      resolve(1);
      return;
    }
    resolve(code ?? 1);
  });
});

process.exit(exitCode);
