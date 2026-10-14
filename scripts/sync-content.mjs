#!/usr/bin/env node
// Pull the Learn articles from the plan repo (private dcsim-plan, ~/Sensaka/marketing/homelab-site/learn) into MDX for this site.
// Run locally: npm run sync  (CI never runs this — the generated .mdx files are committed).
// - "Homelab Sim" and {{PRODUCT_NAME}} → {PRODUCT_NAME} (the constant in src/config/brand.ts)
// - {{CONTACT_EMAIL}} → a mailto link from the constant
// - a line starting with `<Calculator />` → the live component
// - internal notes (blockquotes starting "> Table goes here") → a short public note
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.PLAN_LEARN ?? join(process.env.HOME, 'Sensaka/marketing/homelab-site/learn');
const OUT = join(here, '../src/content/learn');
const PUBLISH = ['tokens-per-watt', '10-inch-mini-rack-planner', 'homelab-power-calculator', 'proxmox-power-usage']; // weekly runs add slugs here
const TEASERS = {
  'tokens-per-watt': 'Divide tokens per second by watts: that is tokens per joule. Multiply by 3.6 million for tokens per kWh.',
  '10-inch-mini-rack-planner': 'A 254 mm panel, about 222 mm between the rails, 44.45 mm per U. Check width, depth and U before you buy.',
  'homelab-power-calculator': 'Monthly cost = average watts × 730 ÷ 1,000 × your price per kWh. Idle draw is most of the bill.',
  'proxmox-power-usage': 'Proxmox has no power meter of its own: measure at the wall or the UPS, then cut idle watts.',
  'ups-runtime-calculator': 'Aim for 10 minutes at your real load, with the UPS under about 60 % of its watt rating.',
};
mkdirSync(OUT, { recursive: true });
let problems = 0;
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.md') && f !== 'COMPONENTS.md')) {
  const slug = file.replace(/\.md$/, '');
  if (!PUBLISH.includes(slug)) continue;
  const raw = readFileSync(join(SRC, file), 'utf8');
  const [, fm, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const comps = new Set();
  const lines = body.split('\n');
  const outLines = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const m = line.match(/^`<([A-Z][A-Za-z]+) \/>`[,:]?\s*(.*)$/);
    if (m) {
      comps.add(m[1]);
      const rest = m[2].trim();
      if (rest) outLines.push(rest.charAt(0).toUpperCase() + rest.slice(1), '');
      outLines.push(`<${m[1]} />`);
      continue;
    }
    if (/^> Table goes here/.test(line)) {
      while (i + 1 < lines.length && lines[i + 1].startsWith('>')) i++;
      outLines.push('*The table appears here once at least ten measurements are in.*');
      continue;
    }
    outLines.push(line);
  }
  let mdx = outLines.join('\n')
    .replace(/\{\{PRODUCT_NAME\}\}|Homelab Sim/g, '{PRODUCT_NAME}')
    .replace(/\{\{CONTACT_EMAIL\}\}/g, '<a href={MAILTO}>{CONTACT_EMAIL}</a>');
  // MDX safety: flag raw < or { outside code spans/blocks that we didn't generate
  let inFence = false;
  mdx.split('\n').forEach((l, n) => {
    if (l.startsWith('```')) { inFence = !inFence; return; }
    if (inFence) return;
    const noCode = l.replace(/`[^`]*`/g, '').replace(/<[A-Z][A-Za-z]+ \/>/g, '').replace(/\{PRODUCT_NAME\}|\{CONTACT_EMAIL\}|<a href=\{MAILTO\}>|<\/a>/g, '');
    if (/[{}]|<[a-zA-Z]/.test(noCode)) { console.warn(`${file}:${n + 1}: MDX-unsafe text: ${l}`); problems++; }
  });
  const imports = [`import { PRODUCT_NAME, CONTACT_EMAIL, MAILTO } from '../../config/brand';`,
    ...[...comps].map((c) => `import ${c} from '../../components/calc/${c}.astro';`)].join('\n');
  const teaser = TEASERS[slug] ?? '';
  writeFileSync(join(OUT, `${slug}.mdx`), `---\n${fm}\nteaser: ${JSON.stringify(teaser)}\n---\n${imports}\n\n${mdx.trim()}\n`);
  console.log(`synced ${slug}.mdx (${[...comps].join(', ') || 'no calculator'})`);
}
if (problems) { console.error(`${problems} MDX-unsafe line(s)`); process.exit(1); }
