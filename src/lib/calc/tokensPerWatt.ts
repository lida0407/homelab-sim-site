// Tokens per watt / tokens per kWh — pure math for /learn/tokens-per-watt. No DOM, no deps.
export interface TpwInput {
  tokPerSec: number;        // output tokens per second while generating
  wattsWall: number;        // power at the wall while generating (W)
  pricePerKwh: number;      // electricity price per kWh (any currency)
  idleWatts?: number;       // power at the wall while idle (W) — optional, for the all-in daily view
  hoursGenPerDay?: number;  // hours per day spent generating (0–24) — optional
}
export interface TpwResult {
  tokensPerJoule: number;
  tokensPerKwh: number;
  joulesPerToken: number;
  costPer1M: number;                 // electricity per 1M output tokens, generation only
  daily?: {
    kwh: number; tokens: number; cost: number;
    tokensPerKwhAllIn: number | null;   // null when no tokens are generated
    costPer1MAllIn: number | null;
  };
}
const J_PER_KWH = 3_600_000;

export function tokensPerWatt(i: TpwInput): TpwResult {
  if (!(i.tokPerSec > 0) || !(i.wattsWall > 0) || !(i.pricePerKwh >= 0)) throw new RangeError('tok/s and watts must be > 0, price ≥ 0');
  const tokensPerJoule = i.tokPerSec / i.wattsWall;          // W = J/s
  const tokensPerKwh = tokensPerJoule * J_PER_KWH;
  const res: TpwResult = {
    tokensPerJoule, tokensPerKwh,
    joulesPerToken: 1 / tokensPerJoule,
    costPer1M: (1_000_000 / tokensPerKwh) * i.pricePerKwh,
  };
  if (i.hoursGenPerDay !== undefined && i.idleWatts !== undefined) {
    const h = Math.min(24, Math.max(0, i.hoursGenPerDay));
    const kwh = (i.wattsWall * h + i.idleWatts * (24 - h)) / 1000;
    const tokens = i.tokPerSec * 3600 * h;
    res.daily = {
      kwh, tokens, cost: kwh * i.pricePerKwh,
      tokensPerKwhAllIn: tokens > 0 ? tokens / kwh : null,
      costPer1MAllIn: tokens > 0 ? (kwh * i.pricePerKwh) / (tokens / 1_000_000) : null,
    };
  }
  return res;
}
