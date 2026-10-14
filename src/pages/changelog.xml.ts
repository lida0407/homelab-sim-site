import { getCollection } from 'astro:content';
import { abs } from '../lib/url';
import { PRODUCT_NAME } from '../config/brand';
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
export async function GET() {
  const items = (await getCollection('changelog')).sort((a, b) => +b.data.date - +a.data.date).slice(0, 20);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(PRODUCT_NAME)} changelog</title><link>${abs('/changelog')}</link><description>What's new in ${esc(PRODUCT_NAME)}</description><language>en</language>
${items.map((e) => `<item><title>${esc(e.data.title)}</title><link>${abs('/changelog')}#${e.id}</link><guid isPermaLink="false">${e.id}</guid><pubDate>${e.data.date.toUTCString()}</pubDate><description>${esc(e.data.summary)}</description></item>`).join('\n')}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
