// Builds limu-rs's playground for the site: the module limu-rs's scripts/playground.sh
// builds from its crates/limu-playground, and limu.js, the script that calls it, from the
// commit or tag limu-rs.json names, into public/assets/playground/rust, each named by a hash
// of its content, so that the site can have browsers keep them for good. It writes their
// names and the module's size to src/generated/playground-rust.json, which the page that
// loads them, src/pages/playground/rust.astro, reads. With LIMU_RS set to a checkout of
// limu-rs, it builds that checkout as it is instead. Run it from the repository's root:
//
//	node scripts/playground-rust.mjs
//
// It needs cargo and Rust's wasm32-unknown-unknown target.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const out = 'public/assets/playground/rust';
const pin = JSON.parse(readFileSync('limu-rs.json', 'utf8'));

const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] });

let checkout = process.env.LIMU_RS ? resolve(process.env.LIMU_RS) : undefined;
const tmp = checkout ? undefined : mkdtempSync(join(tmpdir(), 'limu-rs-'));
try {
  if (!checkout) {
    checkout = tmp;
    run('git', ['init', '-q'], checkout);
    run('git', ['fetch', '-q', '--depth', '1', pin.repository, pin.ref], checkout);
    run('git', ['checkout', '-q', 'FETCH_HEAD'], checkout);
  }
  run('./scripts/playground.sh', [], checkout);
  const built = join(checkout, 'target', 'playground');
  const wasm = readFileSync(join(built, 'limu_playground.wasm'));
  const script = readFileSync(join(built, 'limu.js'));

  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  const names = { wasm: `limu.${hash(wasm)}.wasm`, script: `limu.${hash(script)}.js` };
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, names.wasm), wasm);
  writeFileSync(join(out, names.script), script);
  mkdirSync('src/generated', { recursive: true });
  writeFileSync('src/generated/playground-rust.json', `${JSON.stringify({
    wasm: `/assets/playground/rust/${names.wasm}`,
    script: `/assets/playground/rust/${names.script}`,
    size: wasm.length,
    ref: process.env.LIMU_RS ? 'local' : pin.ref,
  }, null, 2)}\n`);
  console.log(`playground-rust: ${names.wasm}, ${(wasm.length / 1024 / 1024).toFixed(1)} MiB`);
} finally {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
}
