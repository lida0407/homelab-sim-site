// Electricity price shared by every calculator; remembered in this browser only (localStorage, guarded).
export interface PricePref { currency: string; price: number }
const KEY = 'rd.price';
const DEFAULTS: Record<string, number> = { '€': 0.30, '$': 0.17, '£': 0.25 };
export const defaultPrice = (currency: string): number => DEFAULTS[currency] ?? 0.30;

export function loadPrice(): PricePref {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v.price === 'number' && typeof v.currency === 'string') return v;
  } catch { /* storage unavailable */ }
  const lang = navigator.language || '';
  const currency = /^en-(US|CA)$/i.test(lang) ? '$' : /^en-GB$/i.test(lang) ? '£' : '€';
  return { currency, price: defaultPrice(currency) };
}
export function savePrice(p: PricePref): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('rd:price', { detail: p }));
}
/** Wire a currency <select> + price <input> inside `root` to the shared preference. Calls `onChange` on every change. */
export function bindPrice(root: HTMLElement, onChange: () => void): () => PricePref {
  const cur = root.querySelector<HTMLSelectElement>('[data-currency]')!;
  const price = root.querySelector<HTMLInputElement>('[data-price]')!;
  const p = loadPrice();
  cur.value = p.currency; price.value = String(p.price);
  cur.addEventListener('change', () => { price.value = String(defaultPrice(cur.value)); savePrice(read()); onChange(); });
  price.addEventListener('input', () => { savePrice(read()); onChange(); });
  window.addEventListener('rd:price', (e) => {
    const d = (e as CustomEvent<PricePref>).detail;
    if (d.currency !== cur.value || String(d.price) !== price.value) { cur.value = d.currency; price.value = String(d.price); onChange(); }
  });
  const read = (): PricePref => ({ currency: cur.value, price: Math.max(0, parseFloat(price.value) || 0) });
  return read;
}
export const num = (el: HTMLInputElement | null, fallback = 0): number => {
  const v = parseFloat(el?.value ?? '');
  return Number.isFinite(v) ? v : fallback;
};
export const fmt = (v: number, d = 0): string => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const money = (cur: string, v: number, d = 2): string => `${cur}${fmt(v, d)}`;
