# homelab-sim-site

Static marketing site for **Homelab Sim** (brand RACKDENSITY), built with Astro and published on GitHub Pages:
https://lida0407.github.io/homelab-sim-site/

The copy and the rules for what the site may claim live in the private plan repo (`dcsim-plan`, `marketing/homelab-site/`: `copy/`, `learn/`, `CLAIMS.md`). This repo holds only the site source.

## Commands
```
npm ci
npm test          # calculator math (node --test, Node ≥ 22.12)
npm run dev       # http://localhost:4321/homelab-sim-site/
npm run build     # astro build + scripts/check-dist.mjs (links, one H1, title/description/canonical, JSON-LD)
npm run sync      # pull Learn articles from ~/Sensaka/marketing/homelab-site/learn → src/content/learn/*.mdx (local only)
npm run og        # regenerate public/og/*.png and public/icon-512.png (local only)
```
Push to `main` → `.github/workflows/deploy.yml` tests, builds and deploys to Pages.

## One place for each fact
- **Where the site lives:** `site.config.mjs` (`SITE_URL`, `BASE`). Moving to rack-density.com: set `SITE_URL = 'https://rack-density.com'`, `BASE = '/'`, add `public/CNAME` containing `rack-density.com`, point DNS at GitHub Pages, set the custom domain in the repo's Pages settings.
- **Product name, contact, prices, Try URL, feature flags:** `src/config/brand.ts`. `TRY.live` stays `false` until the homelab dev agent logs the public redeploy in `share/updatehl.md`; then set `TRY.url` and `TRY.live = true`.
- **FAQ text:** `src/data/faq.ts` (each array renders the visible FAQ and its FAQPage JSON-LD).
- **Calculator math:** `src/lib/calc/*.ts` (pure TypeScript, tested in `calc.test.ts`).

## Adding a Learn article
Write it in the plan repo (`marketing/homelab-site/learn/<slug>.md`, front matter as the existing ones), add the slug to `PUBLISH` in `scripts/sync-content.mjs`, add an OG title to `scripts/og.mjs`, run `npm run sync && npm run og && npm run build`, then commit.
