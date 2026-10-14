// Homelab power cost — pure math for /learn/homelab-power-calculator.
export interface DeviceRow { name: string; qty: number; idleW: number; loadW: number; loadHoursPerDay: number }
export interface DeviceCost { name: string; avgW: number; kwhMonth: number; costMonth: number; share: number }
export interface LabCost {
  avgW: number; kwhDay: number; kwhMonth: number; kwhYear: number;
  costMonth: number; costYear: number; btuPerHour: number; devices: DeviceCost[];
}
export const HOURS_PER_MONTH = 730;     // 8,760 h / 12
export const BTU_PER_W = 3.412;

export const avgWatts = (d: DeviceRow): number => {
  const h = Math.min(24, Math.max(0, d.loadHoursPerDay));
  return Math.max(0, d.qty) * (d.idleW * (24 - h) + d.loadW * h) / 24;
};

export function labCost(rows: DeviceRow[], pricePerKwh: number, upsLossPct = 0): LabCost {
  const factor = 1 + Math.max(0, upsLossPct) / 100;
  const per = rows.map((d) => ({ name: d.name, avgW: avgWatts(d) * factor }));
  const avgW = per.reduce((s, d) => s + d.avgW, 0);
  const devices = per
    .map((d) => ({ name: d.name, avgW: d.avgW, kwhMonth: (d.avgW * HOURS_PER_MONTH) / 1000, costMonth: (d.avgW * HOURS_PER_MONTH / 1000) * pricePerKwh, share: avgW > 0 ? d.avgW / avgW : 0 }))
    .sort((a, b) => b.avgW - a.avgW);
  const kwhMonth = (avgW * HOURS_PER_MONTH) / 1000;
  return { avgW, kwhDay: (avgW * 24) / 1000, kwhMonth, kwhYear: (avgW * 8760) / 1000, costMonth: kwhMonth * pricePerKwh, costYear: (avgW * 8760 / 1000) * pricePerKwh, btuPerHour: avgW * BTU_PER_W, devices };
}

/** Typical starting values (W at the wall). Replace with measurements; real devices vary a lot. */
export const PRESETS: Omit<DeviceRow, 'qty' | 'loadHoursPerDay'>[] = [
  { name: 'Mini PC (low-power quad-core)', idleW: 8, loadW: 25 },
  { name: 'Mini PC (6–8 core)', idleW: 12, loadW: 50 },
  { name: 'Raspberry Pi / SBC', idleW: 4, loadW: 8 },
  { name: 'NAS, 4 bays, HDDs spinning', idleW: 30, loadW: 45 },
  { name: '1U server (older dual-socket)', idleW: 80, loadW: 160 },
  { name: '2U server (older dual-socket)', idleW: 110, loadW: 220 },
  { name: 'Desktop tower as server', idleW: 35, loadW: 120 },
  { name: 'AI box, one 24 GB GPU', idleW: 60, loadW: 400 },
  { name: 'Switch, 8-port unmanaged', idleW: 4, loadW: 5 },
  { name: 'Switch, 24-port managed (PoE load not included)', idleW: 20, loadW: 25 },
  { name: 'Router / firewall appliance', idleW: 12, loadW: 18 },
  { name: 'Wi-Fi access point (if not on PoE)', idleW: 6, loadW: 12 },
];
