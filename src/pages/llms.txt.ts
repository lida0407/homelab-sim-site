import { getCollection } from 'astro:content';
import { abs } from '../lib/url';
import { PRODUCT_NAME, BRAND, PRICES, CONTACT_EMAIL } from '../config/brand';
export async function GET() {
  const learn = await getCollection('learn');
  const body = `# ${BRAND} — ${PRODUCT_NAME}

> ${PRODUCT_NAME} turns a spreadsheet of your homelab gear (Excel or CSV) into a 3D model of your rack: power and monthly cost per device (estimated), heat, network and cable views, power and network diagrams, and a "Fail" what-if that shows what goes dark. The file is read in the browser and never uploaded. Try is free with no account and nothing stored; Account ($${PRICES.account.month}/month or $${PRICES.account.year}/year) and Pro ($${PRICES.pro.month}/month) are launching soon.

## Product
- [Try ${PRODUCT_NAME}](${abs('/try')}): the demo lab and the import template
- [Pricing](${abs('/pricing')}): what each plan includes; roadmap items are marked
- [Changelog](${abs('/changelog')}): what has shipped

## Free calculators
- [Rack Density Calculator](${abs('/calculator')}): devices per rack by space, power and cooling; kW per rack; monthly cost

## Guides
${learn.map((e) => `- [${e.data.title}](${abs(`/learn/${e.data.slug}`)}): ${e.data.answer}`).join('\n')}

## Facts
- Import: the template's Devices sheet is required (rack, U, model); Cables, Racks, Power, Networks and Readings are optional.
- Power, heat and cost figures are estimates from each model's typical draw, adjusted by any readings the user adds.
- Tokens per kWh = tokens per second ÷ watts × 3,600,000.
- Contact: ${CONTACT_EMAIL}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
