import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { SITE_URL, BASE } from './site.config.mjs';

export default defineConfig({
  site: SITE_URL,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [mdx()],
  devToolbar: { enabled: false },
});
