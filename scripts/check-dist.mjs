#!/usr/bin/env node
// Post-build checks: every internal link/asset resolves, every page has one H1, a title, description, canonical, and valid JSON-LD.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BASE } from '../site.config.mjs';
const DIST = 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const html = walk(DIST).filter((f) => f.endsWith('.html'));
let bad = 0;
const fail = (m) => { console.log('✖', m); bad++; };
for (const f of html) {
  const s = readFileSync(f, 'utf8');
  const h1 = (s.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail(`${f}: ${h1} <h1>`);
  if (!/<title>[^<]+<\/title>/.test(s)) fail(`${f}: no title`);
  if (!/<meta name="description" content="[^"]+"/.test(s)) fail(`${f}: no description`);
  if (!/<link rel="canonical" href="https:\/\/[^"]+"/.test(s)) fail(`${f}: no canonical`);
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { fail(`${f}: bad JSON-LD`); } }
  for (const m of s.matchAll(/(?:href|src|srcset)="([^"]+)"/g)) {
    for (const ref of m[1].split(',').map((x) => x.trim().split(' ')[0])) {
      if (!ref.startsWith(BASE + '/') && ref !== BASE + '/') continue;
      const p = decodeURI(ref.slice(BASE.length).split('#')[0].split('?')[0]);
      const t = join(DIST, p);
      if (!(existsSync(t) && statSync(t).isFile()) && !existsSync(join(t, 'index.html'))) fail(`${f}: broken ${ref}`);
    }
  }
}
console.log(`${html.length} pages checked, ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
