import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDuration,
  formatDurationKorean,
  generateTablePlan,
  generatePyramidPlan,
  generateOneBreathPlan,
  calculateTotalPlanDuration,
  calculateApneaStats,
  validateApneaBackup
} from '../src/utils/apnea.ts';

test('formatDuration formats seconds to mm:ss correctly', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(45), '00:45');
  assert.equal(formatDuration(60), '01:00');
  assert.equal(formatDuration(125), '02:05');
  assert.equal(formatDuration(3600), '60:00');
  assert.equal(formatDuration(-10), '00:00');
});

test('formatDurationKorean formats seconds to Korean text', () => {
  assert.equal(formatDurationKorean(0), '0초');
  assert.equal(formatDurationKorean(45), '45초');
  assert.equal(formatDurationKorean(60), '1분');
  assert.equal(formatDurationKorean(125), '2분 5초');
});

test('generateTablePlan generates valid CO2 8-round plan', () => {
  const pbSec = 180; // 3:00
  const plan = generateTablePlan('co2', pbSec, 8);

  assert.equal(plan.length, 8);
  // Fixed hold at 50% PB = 90s
  for (const round of plan) {
    assert.equal(round.holdDurationSec, 90);
  }

  // Rest decreases by 15s each round starting from 120s
  assert.equal(plan[0].restDurationSec, 120);
  assert.equal(plan[1].restDurationSec, 105);
  assert.equal(plan[2].restDurationSec, 90);
  assert.equal(plan[3].restDurationSec, 75);
  assert.equal(plan[4].restDurationSec, 60);
  assert.equal(plan[5].restDurationSec, 45);
  assert.equal(plan[6].restDurationSec, 30);
  assert.equal(plan[7].restDurationSec, 15);
});

test('generateTablePlan generates valid O2 8-round plan', () => {
  const pbSec = 180; // 3:00
  const plan = generateTablePlan('o2', pbSec, 8);

  assert.equal(plan.length, 8);
  // Fixed rest at 120s
  for (const round of plan) {
    assert.equal(round.restDurationSec, 120);
  }

  // Hold increases by 15s each round starting from ~35% PB (65s rounded to 65s)
  assert.equal(plan[0].holdDurationSec, 65);
  assert.equal(plan[1].holdDurationSec, 80);
  assert.equal(plan[2].holdDurationSec, 95);
  assert.equal(plan[3].holdDurationSec, 110);
  assert.equal(plan[4].holdDurationSec, 125);
  assert.equal(plan[5].holdDurationSec, 140);
  assert.equal(plan[6].holdDurationSec, 155);
  assert.equal(plan[7].holdDurationSec, 170);
});

test('calculateTotalPlanDuration calculates total workout time', () => {
  const plan = [
    { roundNumber: 1, restDurationSec: 120, holdDurationSec: 60 },
    { roundNumber: 2, restDurationSec: 105, holdDurationSec: 60 }
  ];
  // 120 + (120+60) + (105+60) = 465
  const total = calculateTotalPlanDuration(plan, 120);
  assert.equal(total, 465);
});

test('calculateApneaStats computes sessions, total hold, and max PB accurately', () => {
  const histories = [
    {
      id: '1',
      date: '2026-08-24T00:00:00.000Z',
      type: 'co2',
      totalDurationSec: 600,
      completedRounds: 8,
      totalRounds: 8,
      rounds: [
        { roundNumber: 1, targetHoldSec: 60, actualHoldSec: 60, actualRestSec: 120, contractions: [], firstContractionSec: 40 },
        { roundNumber: 2, targetHoldSec: 60, actualHoldSec: 60, actualRestSec: 105, contractions: [], firstContractionSec: 35 }
      ],
      maxHoldSec: 60,
      firstContractionSec: 40
    },
    {
      id: '2',
      date: '2026-08-24T01:00:00.000Z',
      type: 'free',
      totalDurationSec: 300,
      completedRounds: 1,
      totalRounds: 1,
      rounds: [
        { roundNumber: 1, targetHoldSec: 200, actualHoldSec: 200, actualRestSec: 0, contractions: [], firstContractionSec: 90 }
      ],
      maxHoldSec: 200,
      firstContractionSec: 90
    }
  ];

  const stats = calculateApneaStats(histories, 180);
  assert.equal(stats.totalSessions, 2);
  assert.equal(stats.totalHoldSec, 320); // 60 + 60 + 200
  assert.equal(stats.maxPbSec, 200);
  assert.equal(stats.recentAvgFirstContractionSec, 65); // (40 + 90) / 2 = 65
});

test('validateApneaBackup validates schema correctly', () => {
  const valid = {
    version: 1,
    exportedAt: '2026-08-24T00:00:00.000Z',
    pbHoldSec: 180,
    histories: [
      {
        id: 'test-1',
        date: '2026-08-24T00:00:00.000Z',
        type: 'co2',
        totalDurationSec: 600,
        completedRounds: 8,
        totalRounds: 8,
        rounds: [],
        maxHoldSec: 90
      }
    ]
  };

  assert.equal(validateApneaBackup(valid), true);
  assert.equal(validateApneaBackup(null), false);
  assert.equal(validateApneaBackup({ histories: 'invalid' }), false);
  assert.equal(validateApneaBackup({ histories: [{ id: 123 }] }), false);
});

test('generatePyramidPlan generates balanced ascent and descent hold times', () => {
  const peakHoldSec = 120;
  const baseRestSec = 60;
  const rounds = 6;
  const plan = generatePyramidPlan(peakHoldSec, baseRestSec, rounds);

  assert.equal(plan.length, 6);
  // Rest should be fixed at baseRestSec
  for (const r of plan) {
    assert.equal(r.restDurationSec, 60);
  }
  // Middle rounds should reach peak
  const maxHold = Math.max(...plan.map((r) => r.holdDurationSec));
  assert.equal(maxHold, peakHoldSec);
  // Start and end should be lower than peak
  assert.ok(plan[0].holdDurationSec < peakHoldSec);
  assert.ok(plan[5].holdDurationSec < peakHoldSec);
});

test('generateOneBreathPlan generates short 15s rest intervals', () => {
  const plan = generateOneBreathPlan(60, 15, 6);
  assert.equal(plan.length, 6);
  for (const r of plan) {
    assert.equal(r.restDurationSec, 15);
    assert.equal(r.holdDurationSec, 60);
  }
});
