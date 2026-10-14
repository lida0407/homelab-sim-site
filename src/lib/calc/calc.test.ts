// Run: npm test   (Node ≥ 23.6 strips TS types natively)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokensPerWatt } from './tokensPerWatt.ts';
import { uNeeded, fitDevice, planRack } from './rackFit.ts';
import { labCost, avgWatts } from './powerCost.ts';
import { idleSavings, paybackMonths } from './idleSavings.ts';

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);

test('tokens per watt: 30 tok/s at 350 W, €0.30', () => {
  const r = tokensPerWatt({ tokPerSec: 30, wattsWall: 350, pricePerKwh: 0.30 });
  near(r.tokensPerJoule, 30 / 350);
  near(r.tokensPerKwh, 308571.4285714);
  near(r.joulesPerToken, 11.6666667);
  near(r.costPer1M, 0.9722222);
});
test('tokens per watt: power-limited 29 tok/s at 250 W', () => {
  const r = tokensPerWatt({ tokPerSec: 29, wattsWall: 250, pricePerKwh: 0.30 });
  near(r.tokensPerKwh, 417600);
  near(r.costPer1M, 0.7183908);
});
test('tokens per watt: all-in daily with idle', () => {
  const r = tokensPerWatt({ tokPerSec: 30, wattsWall: 350, pricePerKwh: 0.30, idleWatts: 90, hoursGenPerDay: 2 });
  near(r.daily!.kwh, (350 * 2 + 90 * 22) / 1000);   // 2.68 kWh
  near(r.daily!.tokens, 216000);
  near(r.daily!.tokensPerKwhAllIn!, 216000 / 2.68);
  near(r.daily!.costPer1MAllIn!, (2.68 * 0.30) / 0.216);
});
test('tokens per watt: zero generation hours → null all-in', () => {
  const r = tokensPerWatt({ tokPerSec: 30, wattsWall: 350, pricePerKwh: 0.3, idleWatts: 90, hoursGenPerDay: 0 });
  assert.equal(r.daily!.tokensPerKwhAllIn, null);
});
test('tokens per watt: rejects zero watts', () => {
  assert.throws(() => tokensPerWatt({ tokPerSec: 30, wattsWall: 0, pricePerKwh: 0.3 }), RangeError);
});

test('U needed', () => {
  assert.equal(uNeeded(44.45), 1);
  assert.equal(uNeeded(44), 1);
  assert.equal(uNeeded(45), 2);    // just over 1U
  assert.equal(uNeeded(88.9), 2);
  assert.equal(uNeeded(37), 1);
});
test('10" fit: 200 mm wide mini PC on 250 mm deep rack', () => {
  const r = fitDevice({ rack: '10', rackDepthMm: 250, deviceWidthMm: 200, deviceDepthMm: 190, deviceHeightMm: 50 });
  assert.equal(r.fitsWidth, true);
  assert.equal(r.fitsDepth, true);
  assert.equal(r.u, 2);
});
test('10" fit: 230 mm wide device does not fit', () => {
  const r = fitDevice({ rack: '10', rackDepthMm: 300, deviceWidthMm: 230, deviceDepthMm: 150, deviceHeightMm: 40 });
  assert.equal(r.fitsWidth, false);
  assert.equal(r.fits, false);
  assert.match(r.notes[0], /Too wide by 7.8 mm/);
});
test('10" fit: depth includes cable clearance', () => {
  const r = fitDevice({ rack: '10', rackDepthMm: 200, deviceWidthMm: 180, deviceDepthMm: 160, deviceHeightMm: 40 });
  assert.equal(r.fitsDepth, false);     // 200 - 160 - 50 = -10
  near(r.depthSpareMm, -10);
});
test('plan rack', () => {
  const r = planRack(8, [{ name: 'switch', u: 1, watts: 10 }, { name: 'mini pc shelf', u: 2, watts: 40 }, { name: 'nas', u: 3, watts: 35 }]);
  assert.deepEqual(r, { usedU: 6, freeU: 2, pctUsed: 75, totalW: 85, overflowU: 0 });
  assert.equal(planRack(4, [{ name: 'x', u: 6 }]).overflowU, 2);
});

test('power cost: average watts with load hours', () => {
  near(avgWatts({ name: 'srv', qty: 1, idleW: 100, loadW: 200, loadHoursPerDay: 6 }), 125);
  near(avgWatts({ name: 'pi', qty: 3, idleW: 4, loadW: 8, loadHoursPerDay: 0 }), 12);
});
test('power cost: 200 W lab at €0.30 → €43.80 / month', () => {
  const r = labCost([{ name: 'lab', qty: 1, idleW: 200, loadW: 200, loadHoursPerDay: 0 }], 0.30);
  near(r.kwhMonth, 146);
  near(r.costMonth, 43.8);
  near(r.costYear, 525.6);
  near(r.btuPerHour, 682.4);
});
test('power cost: shares sum to 1, sorted desc, UPS loss applied', () => {
  const r = labCost([
    { name: 'pi', qty: 1, idleW: 4, loadW: 4, loadHoursPerDay: 0 },
    { name: 'srv', qty: 1, idleW: 96, loadW: 96, loadHoursPerDay: 0 },
  ], 0.2, 5);
  near(r.avgW, 105);
  assert.equal(r.devices[0].name, 'srv');
  near(r.devices.reduce((s, d) => s + d.share, 0), 1);
});

test('idle savings and payback', () => {
  const s = idleSavings(150, 30, 0.30);
  near(s.savedW, 120);
  near(s.savedPerMonth, 26.28);
  near(s.savedPerYear, 315.36);
  near(paybackMonths({ oldAvgW: 150, newAvgW: 30, pricePerKwh: 0.30, newHardwareCost: 400, oldResaleValue: 100 })!, 300 / 26.28);
  assert.equal(paybackMonths({ oldAvgW: 30, newAvgW: 40, pricePerKwh: 0.3, newHardwareCost: 100 }), null);
});

import { upsRuntime, minRatedW } from './upsRuntime.ts';
test('UPS: 2 × 12 V 9 Ah at 150 W on a 900 W unit', () => {
  const r = upsRuntime({ loadW: 150, upsRatedW: 900, batteryV: 12, batteryAh: 9, batteryCount: 2 });
  near(r.batteryWh, 216);
  near(r.runtimeMin, 216 * 0.85 * 0.8 / 150 * 60);   // 58.75 min
  near(r.loadPct, 16.6666667);
  assert.equal(r.verdict, 'ok');
});
test('UPS: high load is tight and warns', () => {
  const r = upsRuntime({ loadW: 600, upsRatedW: 900, batteryWh: 216 });
  near(r.runtimeMin, 14.688);
  assert.equal(r.verdict, 'ok');           // 66.7 % load, 14.7 min → ok but with the half-load note
  assert.ok(r.notes.some((n) => /half load/.test(n)));
  const t = upsRuntime({ loadW: 800, upsRatedW: 900, batteryWh: 216 });
  assert.equal(t.verdict, 'tight');
});
test('UPS: overloaded', () => {
  assert.equal(upsRuntime({ loadW: 1000, upsRatedW: 900, batteryWh: 216 }).verdict, 'overloaded');
});
test('UPS: minimum rating for 60 % load', () => {
  assert.equal(minRatedW(150), 250);
  assert.equal(minRatedW(400, 50), 800);
});

import { rackDensity, supplyKw } from './rackDensity.ts';
test('density: original example 42U, 2U, 500 W, 10 kW cooling, 400 V 32 A 3φ', () => {
  const r = rackDensity({ rackU: 42, serverU: 2, wattsPerServer: 500, coolingKw: 10, supply: { phase: 'three', volts: 400, amps: 32, pf: 0.95 } });
  near(r.supplyKw, 21.0617378);
  assert.deepEqual([r.bySpace, r.byPower, r.byCooling, r.servers], [21, 42, 20, 20]);
  near(r.drawKw, 10);
  assert.equal(r.bottleneck, 'cooling');
  assert.equal(r.status, 'critical');      // cooling at 100 %
});
test('density: homelab 12U wall rack on a 230 V 16 A circuit', () => {
  const r = rackDensity({ rackU: 12, serverU: 1, wattsPerServer: 60, coolingKw: 1, supply: { phase: 'single', volts: 230, amps: 16, pf: 0.95 } });
  near(supplyKw({ phase: 'single', volts: 230, amps: 16, pf: 0.95 }), 3.496);
  assert.equal(r.servers, 12);
  assert.equal(r.bottleneck, 'space');
  near(r.drawKw, 0.72);
  assert.equal(r.status, 'ok');            // cooling 72 % → 28 % headroom
});
