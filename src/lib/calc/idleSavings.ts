// Idle-power savings and hardware payback — pure math for /learn/proxmox-power-usage.
export const yearlyCost = (watts: number, pricePerKwh: number): number => (watts * 8760 / 1000) * pricePerKwh;

export interface SavingsResult { savedW: number; savedPerMonth: number; savedPerYear: number }
export function idleSavings(beforeW: number, afterW: number, pricePerKwh: number): SavingsResult {
  const savedW = Math.max(0, beforeW - afterW);
  return { savedW, savedPerMonth: (savedW * 730 / 1000) * pricePerKwh, savedPerYear: (savedW * 8760 / 1000) * pricePerKwh };
}

export interface PaybackInput { oldAvgW: number; newAvgW: number; pricePerKwh: number; newHardwareCost: number; oldResaleValue?: number }
/** Months until a lower-power replacement pays for itself in electricity. null = never (no saving). */
export function paybackMonths(i: PaybackInput): number | null {
  const net = Math.max(0, i.newHardwareCost - (i.oldResaleValue ?? 0));
  const perMonth = idleSavings(i.oldAvgW, i.newAvgW, i.pricePerKwh).savedPerMonth;
  if (perMonth <= 0) return null;
  return net / perMonth;
}
