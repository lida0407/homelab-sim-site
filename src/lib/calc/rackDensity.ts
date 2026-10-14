// Rack density — servers per rack by space, power and cooling (the original rack-density.com calculator, plus circuits).
export type Phase = 'single' | 'three';
export interface Supply { phase: Phase; volts: number; amps: number; pf: number }
export interface DensityInput { rackU: number; serverU: number; wattsPerServer: number; coolingKw: number; supply: Supply }
export type Axis = 'space' | 'power' | 'cooling';
export interface DensityResult {
  supplyKw: number;
  bySpace: number; byPower: number; byCooling: number;
  servers: number; drawKw: number;
  util: Record<Axis, number>;           // 0–1
  bottleneck: Axis;
  minHeadroom: number;                  // over power and cooling, 0–1
  status: 'ok' | 'warn' | 'critical';
}
export const supplyKw = (s: Supply): number =>
  ((s.phase === 'three' ? Math.sqrt(3) : 1) * s.volts * s.amps * s.pf) / 1000;

export function rackDensity(i: DensityInput): DensityResult {
  if (!(i.rackU > 0) || !(i.serverU > 0) || !(i.wattsPerServer > 0) || !(i.coolingKw > 0)) throw new RangeError('inputs must be > 0');
  const sKw = supplyKw(i.supply);
  const bySpace = Math.floor(i.rackU / i.serverU);
  const byPower = Math.floor((sKw * 1000) / i.wattsPerServer);
  const byCooling = Math.floor((i.coolingKw * 1000) / i.wattsPerServer);
  const servers = Math.max(0, Math.min(bySpace, byPower, byCooling));
  const drawKw = (servers * i.wattsPerServer) / 1000;
  const util = { space: (servers * i.serverU) / i.rackU, power: sKw > 0 ? drawKw / sKw : 1, cooling: drawKw / i.coolingKw };
  const counts: [Axis, number][] = [['space', bySpace], ['power', byPower], ['cooling', byCooling]];
  const bottleneck = counts.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  const minHeadroom = Math.min(1 - util.power, 1 - util.cooling);
  const status = minHeadroom >= 0.2 ? 'ok' : minHeadroom >= 0.05 ? 'warn' : 'critical';
  return { supplyKw: sKw, bySpace, byPower, byCooling, servers, drawKw, util, bottleneck, minHeadroom, status };
}
