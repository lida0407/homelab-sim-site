// 10-inch / 19-inch rack fit check and U planner — pure math for /learn/10-inch-mini-rack-planner.
// Dimensions: 1U = 44.45 mm. 10" racks: 254 mm front panel, ≈235 mm hole spacing, ≈222.25 mm clear opening
// (a consensus, not a formal standard — measure your rack). 19" (EIA-310): 482.6 mm panel, 465.1 mm hole spacing, 450 mm opening.
export const U_MM = 44.45;
export const RACKS = {
  '10': { panelMm: 254, holeSpacingMm: 235, openingMm: 222.25 },
  '19': { panelMm: 482.6, holeSpacingMm: 465.1, openingMm: 450 },
} as const;
export type RackWidth = keyof typeof RACKS;

/** Rack units a device of this height occupies (rounded up, with 0.5 mm tolerance for spec-sheet rounding). */
export const uNeeded = (heightMm: number): number => Math.max(1, Math.ceil((heightMm - 0.5) / U_MM));

export interface FitInput {
  rack: RackWidth;
  rackDepthMm: number;          // usable depth, front rail to the back (or the shelf depth)
  deviceWidthMm: number;        // body width, without ears
  deviceDepthMm: number;
  deviceHeightMm: number;
  cableClearanceMm?: number;    // room for plugs and bends behind the device (default 50)
}
export interface FitResult {
  fitsWidth: boolean; fitsDepth: boolean; fits: boolean;
  u: number; widthSpareMm: number; depthSpareMm: number;
  notes: string[];
}
export function fitDevice(i: FitInput): FitResult {
  const r = RACKS[i.rack];
  const clearance = i.cableClearanceMm ?? 50;
  const widthSpareMm = +(r.openingMm - i.deviceWidthMm).toFixed(1);
  const depthSpareMm = +(i.rackDepthMm - i.deviceDepthMm - clearance).toFixed(1);
  const fitsWidth = widthSpareMm >= 0;
  const fitsDepth = depthSpareMm >= 0;
  const notes: string[] = [];
  if (!fitsWidth) notes.push(`Too wide by ${Math.abs(widthSpareMm)} mm for the ${r.openingMm} mm opening.`);
  else if (widthSpareMm < 5) notes.push('Fits the opening with under 5 mm to spare — check your rack, 10" racks vary.');
  if (!fitsDepth) notes.push(`Too deep by ${Math.abs(depthSpareMm)} mm once ${clearance} mm is left for cables.`);
  return { fitsWidth, fitsDepth, fits: fitsWidth && fitsDepth, u: uNeeded(i.deviceHeightMm), widthSpareMm, depthSpareMm, notes };
}

export interface PlanItem { name: string; u: number; watts?: number }
export interface PlanResult { usedU: number; freeU: number; pctUsed: number; totalW: number; overflowU: number }
export function planRack(rackU: number, items: PlanItem[]): PlanResult {
  const usedU = items.reduce((s, d) => s + Math.max(0, d.u), 0);
  const totalW = items.reduce((s, d) => s + Math.max(0, d.watts ?? 0), 0);
  return { usedU, freeU: Math.max(0, rackU - usedU), pctUsed: rackU > 0 ? Math.round((usedU / rackU) * 100) : 0, totalW, overflowU: Math.max(0, usedU - rackU) };
}
