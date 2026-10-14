// UPS runtime and sizing estimate — pure math for /learn/ups-runtime-calculator.
// Linear energy estimate with stated assumptions. Real runtime at high load is shorter (battery chemistry), so the
// verdict leans conservative and the article tells readers to check the vendor's runtime chart or NUT's battery.runtime.
export interface UpsInput {
  loadW: number;              // measured load at the UPS output (W)
  upsRatedW: number;          // the UPS's watt rating (not VA)
  batteryWh?: number;         // battery energy; or give volts × amp-hours × count
  batteryV?: number; batteryAh?: number; batteryCount?: number;
  inverterEff?: number;       // default 0.85
  batteryHealth?: number;     // 0–1, default 0.8 (a battery a few years old)
}
export interface UpsResult {
  loadPct: number;            // load as % of the watt rating
  batteryWh: number;
  runtimeMin: number;         // linear estimate
  verdict: 'overloaded' | 'tight' | 'ok';
  notes: string[];
}
export function upsRuntime(i: UpsInput): UpsResult {
  if (!(i.loadW > 0) || !(i.upsRatedW > 0)) throw new RangeError('load and rating must be > 0');
  const wh = i.batteryWh ?? (i.batteryV ?? 0) * (i.batteryAh ?? 0) * (i.batteryCount ?? 1);
  if (!(wh > 0)) throw new RangeError('battery energy must be > 0');
  const eff = i.inverterEff ?? 0.85;
  const health = i.batteryHealth ?? 0.8;
  const runtimeMin = (wh * eff * health / i.loadW) * 60;
  const loadPct = (i.loadW / i.upsRatedW) * 100;
  const notes: string[] = [];
  let verdict: UpsResult['verdict'] = 'ok';
  if (loadPct > 100) { verdict = 'overloaded'; notes.push('The load is above the UPS watt rating: it will shut off or refuse to switch to battery.'); }
  else if (loadPct > 80 || runtimeMin < 10) { verdict = 'tight'; }
  if (loadPct > 50 && loadPct <= 100) notes.push('Above about half load, real runtime falls below this estimate. Check the runtime chart for your model.');
  if (runtimeMin < 5) notes.push('Under 5 minutes: barely enough for a clean shutdown. Automate it with NUT.');
  else if (runtimeMin < 10) notes.push('Under 10 minutes: fine for a clean shutdown, not for riding out an outage.');
  return { loadPct, batteryWh: wh, runtimeMin, verdict, notes };
}

/** Smallest UPS watt rating that keeps the load at or below targetLoadPct (default 60 %). */
export const minRatedW = (loadW: number, targetLoadPct = 60): number => Math.ceil(loadW / (targetLoadPct / 100));
