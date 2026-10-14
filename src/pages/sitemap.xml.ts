import { getCollection } from 'astro:content';
import { abs } from '../lib/url';
export async function GET() {
  const learn = await getCollection('learn');
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const pages: [string, string][] = [['/', '2026-10-14'], ['/try', '2026-10-14'], ['/calculator', '2026-10-14'], ['/pricing', '2026-10-14'],
    ['/learn', '2026-10-14'], ['/changelog', '2026-10-14'], ['/privacy', '2026-10-14'], ...learn.map((e) => [`/learn/${e.data.slug}`, day(e.data.updated)] as [string, string])];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([p, d]) => `  <url><loc>${abs(p)}</loc><lastmod>${d}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
