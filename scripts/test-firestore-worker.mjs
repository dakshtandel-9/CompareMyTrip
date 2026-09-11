import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const socket = net.createServer();
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const directory = await mkdtemp(path.join(tmpdir(), 'cmt-worker-test-'));
const config = path.join(directory, 'wrangler.jsonc');
await writeFile(config, JSON.stringify({
  name: 'cmt-transport-fixture',
  main: path.resolve('tests/firestore-worker.fixture.mjs'),
  compatibility_date: '2026-08-27',
  compatibility_flags: ['nodejs_compat'],
  // Only descriptor paths reference __dirname; this fixture uses REST exclusively.
  define: { __dirname: JSON.stringify('/') },
}));
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', config, '--local', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { log = (log + data).slice(-20000); });
try {
  let response;
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(5000) });
      break;
    } catch { await delay(300); }
  }
  assert.ok(response, 'Isolated Worker did not start');
  assert.equal(response.status, 200, await response.clone().text());
  assert.deepEqual(await response.json(), { ok: true, calls: ['batchGet', 'runQuery', 'commit', 'batchGet'] });
  console.log('Worker Firestore transport passed: document read, query, simulated write and error decoding. No Firebase requests or real records.');
} catch (error) {
  console.error(log);
  throw error;
} finally {
  child.kill('SIGINT');
  if (child.exitCode === null) await new Promise(resolve => child.once('exit', resolve));
  await rm(directory, { recursive: true, force: true });
}
