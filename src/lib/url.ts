import { SITE_URL } from '../../site.config.mjs';
import { CONTACT_EMAIL } from '../config/brand';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Internal page link with the base prefix and the trailing slash GitHub Pages expects: u('/pricing') → /homelab-sim-site/pricing/ */
export const u = (path: string): string => {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const [p, hash] = path.split('#');
  const clean = p === '/' || p === '' ? '/' : p.endsWith('/') || /\.[a-z0-9]+$/i.test(p) ? p : `${p}/`;
  return `${base}${clean}${hash ? `#${hash}` : ''}`;
};

/** Absolute URL for canonicals, sitemap, schema, OG. */
export const abs = (path: string): string => `${SITE_URL}${u(path)}`;

export const mailto = (subject: string, body = ''): string =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
