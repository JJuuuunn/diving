import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  getThemeColorPalette,
  hexToRgba,
  formatDuration,
  formatChartValue,
  normalizeChartData,
  extractTableDataFromChart
} from '../src/utils/chart.ts';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('CustomChart and specialized wrappers meet UI accessibility, sizing, and hover standards', async () => {
  const chartSource = await read('src/components/CustomChart.vue');
  const barSource = await read('src/components/CustomBarChart.vue');
  const lineSource = await read('src/components/CustomLineChart.vue');
  const doughnutSource = await read('src/components/CustomDoughnutChart.vue');
  const radarSource = await read('src/components/CustomRadarChart.vue');

  // Accessibility & Semantics
  assert.match(chartSource, /role="region"/);
  assert.match(chartSource, /role="img"/);
  assert.match(chartSource, /role="status"/);
  assert.match(chartSource, /class="sr-only"/);
  assert.match(chartSource, /:aria-label="computedAriaLabel"/);
  assert.match(chartSource, /CustomSkeleton/);
  assert.match(chartSource, /CustomTable/);
  assert.match(chartSource, /getSizeClass\('custom-chart-container', size\)/);

  // Hover feature & events
  assert.match(chartSource, /chartHover/);
  assert.match(chartSource, /valueFormatter/);

  // Wrappers delegate to CustomChart and forward hover
  assert.match(barSource, /<CustomChart/);
  assert.match(barSource, /type="bar"/);
  assert.match(barSource, /chartHover/);
  assert.match(lineSource, /<CustomChart/);
  assert.match(lineSource, /type="line"/);
  assert.match(lineSource, /chartHover/);
  assert.match(doughnutSource, /<CustomChart/);
  assert.match(doughnutSource, /type="doughnut"/);
  assert.match(doughnutSource, /chartHover/);
  assert.match(radarSource, /<CustomChart/);
  assert.match(radarSource, /type="radar"/);
  assert.match(radarSource, /showLabelBackdrop:\s*false/);
  assert.match(radarSource, /chartHover/);
});

test('getThemeColorPalette returns high-contrast distinct palettes for all 4 themes', () => {
  const light = getThemeColorPalette('light');
  const dark = getThemeColorPalette('dark');
  const coral = getThemeColorPalette('coral');
  const abyss = getThemeColorPalette('abyss');

  assert.ok(light.length >= 6);
  assert.ok(dark.length >= 6);
  assert.ok(coral.length >= 6);
  assert.ok(abyss.length >= 6);

  assert.notDeepEqual(light, dark);
  assert.notDeepEqual(coral, abyss);
  assert.equal(light[0], '#0284c7');
  assert.equal(dark[0], '#38bdf8');
  assert.equal(dark[1], '#fb7185'); // Distinct Rose contrast with primary Blue
  assert.equal(coral[0], '#ff6b81');
  assert.equal(abyss[0], '#00f2fe');
});

test('hexToRgba converts 3 and 6-character hex colors with alpha', () => {
  assert.equal(hexToRgba('#0284c7', 0.5), 'rgba(2, 132, 199, 0.5)');
  assert.equal(hexToRgba('#fff', 0.8), 'rgba(255, 255, 255, 0.8)');
  assert.equal(hexToRgba('00f2fe', 1), 'rgba(0, 242, 254, 1)');
});

test('formatDuration converts seconds into mm:ss and h:mm:ss strings', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(45), '0:45');
  assert.equal(formatDuration(125), '2:05');
  assert.equal(formatDuration(3600), '1:00:00');
  assert.equal(formatDuration(3665), '1:01:05');
});

test('formatChartValue handles units and custom valueFormatter properly', () => {
  assert.equal(formatChartValue(26, 'm'), '26m');
  assert.equal(formatChartValue(26.54, 'm'), '26.5m');
  assert.equal(formatChartValue(125, '', formatDuration), '2:05');
  assert.equal(formatChartValue(10000, '', (v) => `${Number(v).toLocaleString()}원`), '10,000원');
  assert.equal(formatChartValue('K26', ''), 'K26');
  assert.equal(formatChartValue(null), '');
});

test('normalizeChartData transforms values array into complete Chart.js dataset with hover styling', () => {
  const result = normalizeChartData(
    {
      type: 'bar',
      labels: ['1월', '2월', '3월'],
      values: [10, 20, 30],
      seriesName: '수심'
    },
    'light'
  );

  assert.deepEqual(result.labels, ['1월', '2월', '3월']);
  assert.equal(result.datasets.length, 1);
  assert.equal(result.datasets[0].label, '수심');
  assert.deepEqual(result.datasets[0].data, [10, 20, 30]);
  assert.ok(result.datasets[0].backgroundColor);
  assert.ok(result.datasets[0].borderColor);
  assert.equal(result.datasets[0].borderRadius, 6);
});

test('normalizeChartData adds hoverOffset for doughnut and pointHoverRadius for line', () => {
  const doughnutResult = normalizeChartData(
    {
      type: 'doughnut',
      labels: ['입장료', '렌탈'],
      values: [40, 60]
    },
    'dark'
  );
  assert.equal(doughnutResult.datasets[0].hoverOffset, 8);

  const lineResult = normalizeChartData(
    {
      type: 'line',
      labels: ['1회', '2회'],
      values: [100, 150]
    },
    'dark'
  );
  assert.equal(lineResult.datasets[0].pointHoverRadius, 7);
});

test('normalizeChartData builds multi-dataset structure with theme colors', () => {
  const result = normalizeChartData(
    {
      type: 'line',
      labels: ['1월', '2월'],
      datasets: [
        { label: 'K26', data: [15, 26] },
        { label: '딥스테이션', data: [20, 36] }
      ]
    },
    'dark'
  );

  assert.equal(result.datasets.length, 2);
  assert.equal(result.datasets[0].label, 'K26');
  assert.equal(result.datasets[1].label, '딥스테이션');
  assert.notEqual(result.datasets[0].borderColor, result.datasets[1].borderColor);
});

test('extractTableDataFromChart extracts valid CustomTable columns and rows', () => {
  const chartData = {
    labels: ['1월', '2월', '3월'],
    datasets: [
      { label: '최대 수심', data: [15, 26, 32] },
      { label: '평균 수심', data: [10, 18, 22] }
    ]
  };

  const { columns, rows } = extractTableDataFromChart(chartData, 'm');

  assert.equal(columns.length, 3);
  assert.equal(columns[0].key, 'label');
  assert.equal(columns[1].key, 'dataset_0');
  assert.equal(columns[2].key, 'dataset_1');

  assert.equal(rows.length, 3);
  assert.equal(rows[0].label, '1월');
  assert.equal(rows[0].dataset_0, '15m');
  assert.equal(rows[0].dataset_1, '10m');
  assert.equal(rows[1].dataset_0, '26m');
});

test('useChartTheme composable computes theme-aware Chart.js options without backdrop boxes on radar', async () => {
  const composableSource = await read('src/composables/useChartTheme.ts');
  assert.match(composableSource, /useThemeStore/);
  assert.match(composableSource, /prefers-reduced-motion/);
  assert.match(composableSource, /getMergedOptions/);
  assert.match(composableSource, /tooltip/);
  assert.match(composableSource, /legend/);
  assert.match(composableSource, /scales/);
  assert.match(composableSource, /showLabelBackdrop:\s*false/);
  assert.match(composableSource, /backdropColor:\s*'transparent'/);
});
