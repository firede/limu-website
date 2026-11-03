// Builds the playground for browsers: limumygo's examples/playground, at the version go.mod
// requires it as a tool, compiled to WebAssembly and gzipped, with Go's loader of it,
// wasm_exec.js, into public/assets/playground/go, each named by a hash of its content, so that
// the site can have browsers keep them for good. It writes their names and the gzipped
// WebAssembly's size to src/generated/playground.json, which the page that loads them,
// src/pages/playground.astro, reads, and which unpacks the WebAssembly as it comes. Run it from
// the website directory when the playground or limu changes; pnpm build does not, so that a
// change to the documents does not compile it again:
//
//	node scripts/playground.mjs
//
// The WebAssembly is kept gzipped because it is near the most Cloudflare serves an asset at, 25
// MiB, and gzipped it is far smaller. It fails when the gzipped file passes 24 MiB all the same.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { constants, gzipSync } from 'node:zlib';

const maxSize = 24 * 1024 * 1024;
const out = 'public/assets/playground/go';

const tmp = mkdtempSync(join(tmpdir(), 'limu-playground-'));
try {
  const wasmFile = join(tmp, 'playground.wasm');
  execFileSync('go', ['build', '-trimpath', '-tags', 'mygo_noinspector', '-ldflags=-s -w', '-o', wasmFile, 'github.com/firede/limu/limumygo/examples/playground'], {
    env: { ...process.env, GOOS: 'js', GOARCH: 'wasm' },
    stdio: 'inherit',
  });
  const unpacked = readFileSync(wasmFile);
  // Node's gzip writes no time, so the same WebAssembly gives the same file and the same name.
  const wasm = gzipSync(unpacked, { level: constants.Z_BEST_COMPRESSION });
  if (wasm.length > maxSize) {
    throw new Error(`The playground's gzipped WebAssembly is ${wasm.length} bytes, past the ${maxSize} the site allows.`);
  }
  const goroot = execFileSync('go', ['env', 'GOROOT'], { encoding: 'utf8' }).trim();
  const loader = readFileSync(join(goroot, 'lib', 'wasm', 'wasm_exec.js'));

  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  const names = {
    wasm: `playground.${hash(wasm)}.wasm.gz`,
    loader: `wasm_exec.${hash(loader)}.js`,
  };
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, names.wasm), wasm);
  writeFileSync(join(out, names.loader), loader);
  mkdirSync('src/generated', { recursive: true });
  writeFileSync('src/generated/playground.json', `${JSON.stringify({
    wasm: `/assets/playground/go/${names.wasm}`,
    loader: `/assets/playground/go/${names.loader}`,
    size: wasm.length,
  }, null, 2)}\n`);
  const mib = (n) => (n / 1024 / 1024).toFixed(1);
  console.log(`playground: ${names.wasm}, ${mib(wasm.length)} MiB, ${mib(unpacked.length)} MiB unpacked`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
