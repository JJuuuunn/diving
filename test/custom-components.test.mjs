import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('CustomButton applies loading semantics and blocks duplicate activation', async () => {
  const source = await read('src/components/CustomButton.vue');
  assert.match(source, /:disabled="disabled \|\| loading"/);
  assert.match(source, /:aria-busy="loading \|\| undefined"/);
  assert.match(source, /role="status"/);
  assert.match(source, /custom-ui-button--\$\{size\}/);
  assert.match(source, /custom-ui-button--\$\{shape\}/);
  assert.match(source, /<slot name="leading"/);
  assert.match(source, /<slot name="trailing"/);
});

test('CustomInput exposes validation semantics and shared normalization', async () => {
  const source = await read('src/components/CustomInput.vue');
  assert.match(source, /:aria-invalid="error \? 'true' : undefined"/);
  assert.match(source, /normalizeInputValue/);
  assert.match(source, /update:modelValue/);
  assert.match(source, /<label v-if="label"/);
  assert.match(source, /<slot name="prefix"/);
  assert.match(source, /<slot name="suffix"/);
  assert.match(source, /v-if="error"/);
  assert.match(source, /v-else-if="hint"/);
});

test('CustomSelect is keyboard operable and exposes combobox semantics', async () => {
  const source = await read('src/components/CustomSelect.vue');
  assert.match(source, /role="combobox"/);
  assert.match(source, /@keydown\.enter\.prevent/);
  assert.match(source, /role="option"/);
  assert.match(source, /:aria-disabled="opt.disabled"/);
  assert.match(source, /if \(!option.disabled\) select\(option.value\)/);
});

test('CustomMultiSelect exposes multi-selection semantics and selection controls', async () => {
  const source = await read('src/components/CustomMultiSelect.vue');
  assert.match(source, /aria-multiselectable="true"/);
  assert.match(source, /class="multi-select-chip"/);
  assert.match(source, /:disabled="isAtLimit && !isSelected\(option.value\)"/);
  assert.match(source, /@keydown\.esc="close"/);
});



test('CustomPagination exposes accessible navigation, page list, and size options', async () => {
  const source = await read('src/components/CustomPagination.vue');
  assert.match(source, /role="navigation"/);
  assert.match(source, /aria-label="페이지 이동 네비게이션"/);
  assert.match(source, /aria-current="activePage === p \? 'page' : undefined"/);
  assert.match(source, /getSizeClass\('custom-pagination', size\)/);
  assert.match(source, /changePage/);
  assert.match(source, /changePageSize/);
  assert.match(source, /showQuickJumper/);
});

test('application views do not render native button elements directly', async () => {
  const directories = ['src/views', 'src/layouts'];
  const files = [];
  const walk = async (relativeDirectory) => {
    for (const entry of await readdir(path.join(root, relativeDirectory), { withFileTypes: true })) {
      const relativePath = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) await walk(relativePath);
      else if (entry.name.endsWith('.vue')) files.push(relativePath);
    }
  };
  for (const directory of directories) await walk(directory);
  files.push('src/App.vue');

  const offenders = [];
  for (const file of files) {
    if (/<button\b/.test(await read(file))) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});

test('playground documents every shared component', async () => {
  const playground = await read('src/views/dev/ComponentPlayground.vue');
  const componentFiles = (await readdir(path.join(root, 'src/components'), {
    withFileTypes: true
  }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.vue'))
    .map((entry) => entry.name)
    .sort();

  const missing = componentFiles.filter((file) => !playground.includes(file));
  assert.deepEqual(missing, []);
});

test('new form primitives have dedicated interactive playground sections', async () => {
  const playground = await read('src/views/dev/ComponentPlayground.vue');
  assert.match(playground, /<section id="sec-button"/);
  assert.match(playground, /<CustomButton[^>]*:loading="buttonLoading"/s);
  assert.match(playground, /<section id="sec-input"/);
  assert.match(playground, /<CustomInput\s+v-model="inputBasic"/);
  assert.match(playground, /error="필수 입력값입니다."/);
  assert.match(playground, /<template #prefix>/);
  assert.match(playground, /<template #suffix>/);
  assert.match(playground, /size="xs"/);
  assert.match(playground, /size="xl"/);
  assert.match(playground, /<section id="sec-multiselect"/);
  assert.match(playground, /<CustomMultiSelect/);
  assert.match(playground, /:max-selections="3"/);
});

test('playground navigation and component sections use the same order', async () => {
  const playground = await read('src/views/dev/ComponentPlayground.vue');
  const sectionIds = [...playground.matchAll(/<section id="(sec-[^"]+)"/g)]
    .map((match) => match[1]);
  const navigationSource = playground.match(
    /const sections: PlaygroundNavSection\[\] = \[([\s\S]*?)\];/
  )?.[1] ?? '';
  const navigationIds = [...navigationSource.matchAll(/id: '(sec-[^']+)'/g)]
    .map((match) => match[1]);

  assert.deepEqual(sectionIds, navigationIds);
});

test('playground exposes both single-date and date-range selection', async () => {
  const playground = await read('src/views/dev/ComponentPlayground.vue');
  assert.match(playground, /<CustomDatePicker/);
  assert.match(playground, /<CustomDateRangePicker/);
  assert.match(playground, /v-model="dateRange"/);
  assert.match(playground, /v-model="monthBasic"/);
  assert.match(playground, /mode="month"/);
  assert.match(playground, /v-model="monthRange"/);
});

test('CustomDateRangePicker supports month-range selection', async () => {
  const source = await read('src/components/CustomDateRangePicker.vue');
  assert.match(source, /selectRangeMonth/);
  assert.match(source, /props\.mode === 'month'/);
  assert.match(source, /'is-in-range': isDateInRange\(value, props\.modelValue\)/);
});

test('CustomDatePicker supports month-only selection', async () => {
  const source = await read('src/components/CustomDatePicker.vue');
  assert.match(source, /props\.mode === 'month'/);
  assert.match(source, /format\('YYYY-MM'\)/);
  assert.match(source, /viewMode\.value = props\.mode === 'month' \? 'months' : 'days'/);
});

test('CustomCalendarPanel exposes reusable navigation, selection and cell slots', async () => {
  const source = await read('src/components/CustomCalendarPanel.vue');
  const playground = await read('src/views/dev/ComponentPlayground.vue');

  assert.match(source, /:aria-labelledby="titleId"/);
  assert.match(source, /:aria-pressed="cell\.date === modelValue"/);
  assert.match(source, /emit\('update:modelValue', cell\.date\)/);
  assert.match(source, /emit\('previous'\)/);
  assert.match(source, /emit\('next'\)/);
  assert.match(source, /<slot name="cell"/);
  assert.match(source, /<slot name="selection"/);
  assert.match(source, /variant="ghost"/);
  assert.match(source, /size="xs"/);
  assert.match(playground, /<section id="sec-calendar"/);
  assert.match(playground, /<CustomCalendarPanel/);
});

test('DarkModeToggle is a semantic theme control without animation timers', async () => {
  const source = await read('src/components/DarkModeToggle.vue');
  assert.match(source, /<button/);
  assert.match(source, /:aria-pressed="!isDay"/);
  assert.match(source, /다크 모드로 전환/);
  assert.match(source, /theme-toggle__indicator-label/);
  assert.doesNotMatch(source, /requestAnimationFrame|setTimeout|MAX_DEPTH/);
});

test('competition cards avoid duplicate single-day metadata and expose schedule status', async () => {
  const source = await read('src/views/competition/CompetitionCard.vue');
  assert.match(source, /<span v-if="isMultiDay">📅 일정/);
  assert.match(source, /scheduleLabels/);
  assert.match(source, /getCompetitionStatus/);
  assert.match(source, /<small>\{\{ dateParts\.year \}\}<\/small>/);
});

test('competition screen exposes the redesigned filters, summary and mobile bookmark content', async () => {
  const main = await read('src/views/competition/CompetitionMain.vue');
  const card = await read('src/views/competition/CompetitionCard.vue');
  assert.match(main, /class="competition-summary"/);
  assert.match(main, /v-model="filters\.registrationStatus"/);
  assert.match(main, /value: 'CMAS', label: 'CMAS', disabled: true/);
  assert.match(main, /<h2><span aria-hidden="true">★<\/span> 관심 일정<\/h2>/);
  assert.match(card, /class="bookmark-icon"/);
  assert.match(card, /class="bookmark-label"/);
});

test('normalizeComponentSize maps level 1..10 and legacy xs..xl sizes accurately', async () => {
  const source = await read('src/utils/size.ts');
  assert.match(source, /normalizeComponentSize/);
  assert.match(source, /getSizeClass/);
  assert.match(source, /case 'xs':\s*return 3;/);
  assert.match(source, /case 'sm':\s*return 4;/);
  assert.match(source, /case 'md':\s*return 6;/);
  assert.match(source, /case 'lg':\s*return 8;/);
  assert.match(source, /case 'xl':\s*return 10;/);
});

test('ComponentPlayground includes 10-level interactive size slider, variant, state, and clearable live controls', async () => {
  const playground = await read('src/views/dev/ComponentPlayground.vue');
  assert.match(playground, /demo-size-slider/);
  assert.match(playground, /v-model\.number="demoSize"/);
  assert.match(playground, /min="1"/);
  assert.match(playground, /max="10"/);
  assert.match(playground, /demoState/);
  assert.match(playground, /demoVariant/);
  assert.match(playground, /demoClearable/);
  assert.match(playground, /:size="demoSize"/);
  assert.match(playground, /:state="demoState"/);
  assert.match(playground, /:clearable="demoClearable"/);
});

test('CustomTabs provides ARIA tablist/tab semantics, roving tabindex, and keyboard navigation', async () => {
  const source = await read('src/components/CustomTabs.vue');
  const navSource = await read('src/composables/useKeyboardNav.ts');
  assert.match(source, /role="tablist"/);
  assert.match(source, /role="tab"/);
  assert.match(source, /:tabindex="activeId === tab\.id \? 0 : -1"/);
  assert.match(source, /@keydown="handleKeyDown\(\$event, index\)"/);
  assert.match(source, /handleListArrowNav/);
  assert.match(navSource, /ArrowRight/);
});

test('CustomAccordion exposes ARIA expanded semantics, single/multiple mode, and arrow key navigation', async () => {
  const source = await read('src/components/CustomAccordionItem.vue');
  const navSource = await read('src/composables/useKeyboardNav.ts');
  assert.match(source, /aria-expanded/);
  assert.match(source, /role="region"/);
  assert.match(source, /@keydown="onHeaderKeyDown"/);
  assert.match(source, /handleRovingFocus/);
  assert.match(navSource, /ArrowDown/);
});

test('CustomTooltip exposes Glassmorphic popover, ESC key close, and size scaling', async () => {
  const source = await read('src/components/CustomTooltip.vue');
  const scss = await read('src/assets/scss/components/_tooltip.scss');
  assert.match(source, /role="tooltip"/);
  assert.match(source, /@keydown\.esc="hide"/);
  assert.match(source, /getSizeClass\('custom-tooltip', size\)/);
  assert.match(scss, /&--size-1/);
  assert.match(scss, /&--size-10/);
});

test('CustomSlider supports single/dual range track, keyboard nav, and 10-level sizing', async () => {
  const source = await read('src/components/CustomSlider.vue');
  assert.match(source, /role="slider"/);
  assert.match(source, /aria-valuenow/);
  assert.match(source, /isRange/);
  assert.match(source, /@keydown="onKeyDown\(\$event/);
  assert.match(source, /getSizeClass\('custom-slider', size\)/);
});

test('CustomTable provides table accessibility semantics, sorting, pagination, and selection', async () => {
  const source = await read('src/components/CustomTable.vue');
  const scss = await read('src/assets/scss/components/_table.scss');
  assert.match(source, /role="region"/);
  assert.match(source, /aria-label="데이터 테이블"/);
  assert.match(source, /aria-sort/);
  assert.match(source, /CustomPagination/);
  assert.match(source, /handleSort/);
  assert.match(source, /toggleSelectAll/);
  assert.match(source, /getSizeClass\('custom-table', size\)/);
  assert.match(scss, /&--size-1/);
  assert.match(scss, /&--size-10/);
});

test('CustomErrorBoundary catches child runtime errors and provides retry recovery', async () => {
  const source = await read('src/components/CustomErrorBoundary.vue');
  assert.match(source, /role="alert"/);
  assert.match(source, /aria-live="assertive"/);
  assert.match(source, /onErrorCaptured/);
  assert.match(source, /CustomButton/);
  assert.match(source, /resetError/);
});
