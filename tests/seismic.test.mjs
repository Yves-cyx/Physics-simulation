import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults, simulate} from '../seismic-model.mjs';

test('zero input leaves both systems at rest', () => {
  const run = simulate({pga: 0});
  for (const frame of run.frames) {
    for (const b of [frame.fixed, frame.isolated]) {
      assert(b.u.every(displacement => displacement === 0));
      assert.equal(b.roofA, 0);
      assert.equal(b.energy, 0);
    }
  }
});

test('changing bearing stiffness leaves the input and fixed building unchanged', () => {
  const reference = simulate();
  const softer = simulate({...defaults, period: 5});
  assert.deepEqual(reference.peaks.fixed, softer.peaks.fixed);
  assert.deepEqual(reference.frames.map(f => f.ag), softer.frames.map(f => f.ag));
  assert.notEqual(reference.peaks.base, softer.peaks.base);
});

test('bearing dissipation, quiet endpoints and time-step convergence', () => {
  for (const frequency of [.35, .72, 1.15]) {
    for (const period of [2, 3.2, 5]) {
      for (const pga of [.05, .45]) {
        const inputs = {frequency, period, pga};
        const run = simulate(inputs), refined = simulate(inputs, 10);
        let previousEnergy = 0;
        for (const f of run.frames) {
          assert.equal(f.fixed.u[0], 0);
          assert(f.isolated.energy >= previousEnergy);
          previousEnergy = f.isolated.energy;
          if (f.t >= 21) {
            assert.equal(f.ag, 0);
            assert.equal(f.xg, 0);
          }
        }
        for (const [value, reference] of [
          [run.peaks.base, refined.peaks.base],
          [run.peaks.fixed.drift, refined.peaks.fixed.drift],
          [run.peaks.isolated.a, refined.peaks.isolated.a]
        ]) {
          assert(Math.abs(value - reference) / reference < .01, JSON.stringify(inputs));
        }
      }
    }
  }
});
