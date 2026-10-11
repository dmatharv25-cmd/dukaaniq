import assert from 'node:assert/strict';
import { calculateWasteRisk } from '../src/utils/wasteRisk';

const TODAY = '2026-10-11';

function series(perDay: number, days = 7) {
  return Array.from({ length: days }, (_, i) => ({
    date: `2026-10-${String(12 + i).padStart(2, '0')}`,
    dayOfWeek: 'x',
    predictedQuantity: perDay,
    lowerBound: 0,
    upperBound: perDay + 3,
  }));
}

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log('  ok  ' + name);
}

console.log('--- Waste risk tests ---');

check('expired stock is fully at risk', () => {
  const r = calculateWasteRisk({ quantity: 10, expiryDate: '2026-10-10', purchasePrice: 20 }, { forecastSeries: series(5), hasSufficientData: true }, TODAY);
  assert.equal(r.level, 'expired');
  assert.equal(r.unitsAtRisk, 10);
  assert.equal(r.valueAtRisk, 200);
});

check('stock that sells out before expiry has no risk', () => {
  const r = calculateWasteRisk({ quantity: 20, expiryDate: '2026-10-18', purchasePrice: 10 }, { forecastSeries: series(5), hasSufficientData: true }, TODAY);
  assert.equal(r.level, 'none');
  assert.equal(r.unitsAtRisk, 0);
});

check('40 units, 5/day, 4 days left gives 20 at risk (high)', () => {
  const r = calculateWasteRisk({ quantity: 40, expiryDate: '2026-10-15', purchasePrice: 10 }, { forecastSeries: series(5), hasSufficientData: true }, TODAY);
  assert.equal(r.expectedDemandUntilExpiry, 20);
  assert.equal(r.unitsAtRisk, 20);
  assert.equal(r.percentAtRisk, 50);
  assert.equal(r.level, 'high');
  assert.equal(r.valueAtRisk, 200);
});

check('expiry beyond the forecast window extrapolates (medium)', () => {
  const r = calculateWasteRisk({ quantity: 100, expiryDate: '2026-10-25', purchasePrice: 10 }, { forecastSeries: series(5), hasSufficientData: true }, TODAY);
  assert.equal(r.usedExtrapolation, true);
  assert.equal(r.expectedDemandUntilExpiry, 70);
  assert.equal(r.unitsAtRisk, 30);
  assert.equal(r.level, 'medium');
});

check('insufficient data returns unknown, not a false alarm', () => {
  const r = calculateWasteRisk({ quantity: 50, expiryDate: '2026-10-14', purchasePrice: 10 }, { forecastSeries: series(0), hasSufficientData: false }, TODAY);
  assert.equal(r.level, 'unknown');
});

check('zero stock has no risk', () => {
  const r = calculateWasteRisk({ quantity: 0, expiryDate: '2026-10-14', purchasePrice: 10 }, { forecastSeries: series(5), hasSufficientData: true }, TODAY);
  assert.equal(r.level, 'none');
});

console.log(`WASTE RISK TESTS: ${passed} PASSED`);
