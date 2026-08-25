import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_HUD_LAYOUT,
  HUD_PRESETS,
  useHudDrag
} from '../src/composables/useHudDrag.ts';

test('useHudDrag initializes with default layout or custom layout', () => {
  const { hudLayout, isDragMode } = useHudDrag();
  assert.equal(isDragMode.value, false);
  assert.deepEqual(hudLayout.heroStat, DEFAULT_HUD_LAYOUT.heroStat);
  assert.deepEqual(hudLayout.subline, DEFAULT_HUD_LAYOUT.subline);
  assert.deepEqual(hudLayout.brandBadge, DEFAULT_HUD_LAYOUT.brandBadge);
  assert.deepEqual(hudLayout.rightStats, DEFAULT_HUD_LAYOUT.rightStats);
});

test('useHudDrag applies presets and resets layout correctly', () => {
  let emitted = null;
  const { hudLayout, applyPreset, resetLayout, currentPresetId, toggleDragMode, isDragMode } = useHudDrag({
    onLayoutChange: (layout) => {
      emitted = layout;
    }
  });

  toggleDragMode();
  assert.equal(isDragMode.value, true);

  const label = applyPreset('left-minimal');
  assert.equal(label, '좌측 미니멀');
  assert.equal(currentPresetId.value, 'left-minimal');
  assert.equal(hudLayout.heroStat.x, 5);
  assert.equal(hudLayout.brandBadge.y, 5);
  assert.deepEqual(emitted.brandBadge, { x: 5, y: 5, scale: 1 });

  resetLayout();
  assert.equal(currentPresetId.value, 'sporty-right');
  assert.equal(hudLayout.rightStats.x, 47);
});

test('useHudDrag supports widget scaling and selection', () => {
  let emitted = null;
  const { hudLayout, setWidgetScale, adjustWidgetScale, selectWidget, selectedWidgetKey } = useHudDrag({
    onLayoutChange: (layout) => {
      emitted = layout;
    }
  });

  selectWidget('heroStat');
  assert.equal(selectedWidgetKey.value, 'heroStat');

  setWidgetScale('heroStat', 1.3);
  assert.equal(hudLayout.heroStat.scale, 1.3);
  assert.equal(emitted.heroStat.scale, 1.3);

  adjustWidgetScale('heroStat', 0.2);
  assert.equal(hudLayout.heroStat.scale, 1.5);

  // Clamping test (0.5 .. 2.2)
  setWidgetScale('heroStat', 3.0);
  assert.equal(hudLayout.heroStat.scale, 2.2);

  setWidgetScale('heroStat', 0.2);
  assert.equal(hudLayout.heroStat.scale, 0.5);
});

test('useHudDrag handleWheelZoom adjusts scale with wheel delta', () => {
  const { hudLayout, handleWheelZoom } = useHudDrag();
  assert.equal(hudLayout.heroStat.scale, 1);

  // Wheel up (zoom in)
  handleWheelZoom('heroStat', { deltaY: -100, cancelable: true, preventDefault() {} });
  assert.equal(hudLayout.heroStat.scale, 1.05);

  // Wheel down (zoom out)
  handleWheelZoom('heroStat', { deltaY: 100, cancelable: true, preventDefault() {} });
  assert.equal(hudLayout.heroStat.scale, 1);
});

test('useHudDrag provides 4 standardized layout presets with line icons', () => {
  assert.equal(HUD_PRESETS.length, 4);
  const ids = HUD_PRESETS.map((p) => p.id);
  assert.deepEqual(ids, ['sporty-right', 'left-minimal', 'top-hero', 'balanced']);
});
