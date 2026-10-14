import { abs } from '../lib/url';
export function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml').replace(/\/$/, '')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
