import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = process.argv[2] || 'public';
let count = 0, bytes = 0;
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) await walk(file);
    else if (item.isFile()) {
      const size = (await stat(file)).size;
      count++; bytes += size;
      if (size > 25 * 1024 * 1024) throw new Error(`${file} exceeds Cloudflare's 25 MiB asset limit.`);
    }
  }
}
await walk(root);
if (count > 20000) throw new Error(`${count} assets exceed the configured release budget of 20,000.`);
console.log(`${root}: ${count} assets, ${(bytes / 1024 / 1024).toFixed(2)} MiB; size checks passed.`);
