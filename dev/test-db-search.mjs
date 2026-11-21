/**
 * dev/test-db-search.mjs
 * Unit tests for pure functions in db-search.js.
 *
 * NOTE: Per instructions, this test file is authored for automated test runners
 * (e.g. Node ESM / CI), but not executed in environments where Node is disabled.
 */

import assert from 'node:assert/strict';
import {
  sanitizeUrl,
  isDevFixturesEnabled,
  getDataUrl,
  normalizeItem,
  normalizeData,
  extractFilterOptions,
  filterItems,
  sortItems,
  paginateItems,
  parseUrlState,
  buildUrlSearchParams,
} from '../db-search.js';

console.log('--- Running db-search pure function tests ---');

// ── 1. sanitizeUrl ───────────────────────────────────────────────────────────
{
  assert.equal(sanitizeUrl('https://example.com'), 'https://example.com/');
  assert.equal(sanitizeUrl('https://example.com/app?v=1'), 'https://example.com/app?v=1');
  assert.equal(sanitizeUrl('http://example.com'), 'https://example.com/', 'http should upgrade to https');
  assert.equal(sanitizeUrl('http://example.com/download'), 'https://example.com/download');
  assert.equal(sanitizeUrl('javascript:alert(1)'), null, 'javascript: must be dropped');
  assert.equal(sanitizeUrl('data:text/html,bad'), null, 'data: must be dropped');
  assert.equal(sanitizeUrl('/relative/path'), null, 'relative paths must be dropped');
  assert.equal(sanitizeUrl(''), null, 'empty string must return null');
  assert.equal(sanitizeUrl(null), null, 'null must return null');
  assert.equal(sanitizeUrl(undefined), null, 'undefined must return null');
  console.log('✓ sanitizeUrl tests passed');
}

// ── 2. isDevFixturesEnabled ──────────────────────────────────────────────────
{
  assert.equal(isDevFixturesEnabled('?dev=fixtures', 'localhost'), true);
  assert.equal(isDevFixturesEnabled('?dev=fixtures', 'dev.local'), true);
  assert.equal(isDevFixturesEnabled('?dev=fixtures', 'preview.techfusionreport.pages.dev'), true);

  // Live domain must NEVER enable fixtures
  assert.equal(isDevFixturesEnabled('?dev=fixtures', 'techfusionreport.com'), false);
  assert.equal(isDevFixturesEnabled('?dev=fixtures', 'www.techfusionreport.com'), false);
  assert.equal(isDevFixturesEnabled('?dev=fixtures', 'TECHFUSIONREPORT.COM'), false);

  // No ?dev=fixtures
  assert.equal(isDevFixturesEnabled('', 'localhost'), false);
  assert.equal(isDevFixturesEnabled('?dev=other', 'localhost'), false);
  console.log('✓ isDevFixturesEnabled tests passed');
}

// ── 3. getDataUrl ────────────────────────────────────────────────────────────
{
  // Dev fixture loading on non-prod host
  assert.equal(
    getDataUrl('ai-tools', {
      dataBase: '/data/',
      searchParams: '?dev=fixtures',
      hostname: 'localhost',
    }),
    '/dev/fixtures/ai-tools.json'
  );

  // Production host ALWAYS uses dataBase even if ?dev=fixtures is passed
  assert.equal(
    getDataUrl('ai-tools', {
      dataBase: '/data/',
      searchParams: '?dev=fixtures',
      hostname: 'techfusionreport.com',
    }),
    '/data/ai-tools.json'
  );

  assert.equal(
    getDataUrl('smartphone-apps', {
      dataBase: '/custom-data',
      searchParams: '',
      hostname: 'localhost',
    }),
    '/custom-data/smartphone-apps.json'
  );
  console.log('✓ getDataUrl tests passed');
}

// ── 4. normalizeItem & normalizeData ─────────────────────────────────────────
{
  const raw = {
    id: 'test-app',
    name: 'Test App',
    url: 'http://test.com',
    description: 'A wonderful test tool',
    category: 'Productivity',
    tags: ['Notes', 'Sync'],
    platform: 'iOS, Android',
    price: '$4.99',
    pricing: 'Paid',
    rating: '4.85',
    alternativeTo: 'Evernote',
    date: '2026-11-20',
  };

  const item = normalizeItem(raw);
  assert.equal(item.id, 'test-app');
  assert.equal(item.name, 'Test App');
  assert.equal(item.url, 'https://test.com/');
  assert.equal(item.rating, 4.9);
  assert.ok(item._searchStr.includes('test app'));
  assert.ok(item._searchStr.includes('evernote'));

  // Invalid item without id or name
  assert.equal(normalizeItem({ name: 'No ID' }), null);
  assert.equal(normalizeItem({ id: 'slug' }), null);

  const dataset = normalizeData({
    updated: '2026-11-20T12:00:00Z',
    items: [raw, { id: 'invalid' }],
  });
  assert.equal(dataset.count, 1);
  assert.equal(dataset.items.length, 1);
  console.log('✓ normalizeItem and normalizeData tests passed');
}

// ── 5. extractFilterOptions ──────────────────────────────────────────────────
{
  const items = [
    normalizeItem({ id: '1', name: 'A', url: 'https://a.com', category: 'Tools', platform: 'iOS, Android', tags: ['T1', 'T2'] }),
    normalizeItem({ id: '2', name: 'B', url: 'https://b.com', category: 'Media', platform: 'Web', tags: ['T2', 'T3'] }),
  ];

  const opts = extractFilterOptions(items);
  assert.deepEqual(opts.categories, ['Media', 'Tools']);
  assert.deepEqual(opts.platforms, ['Android', 'Web', 'iOS'].sort());
  assert.deepEqual(opts.tags, ['T1', 'T2', 'T3']);
  console.log('✓ extractFilterOptions tests passed');
}

// ── 6. filterItems ───────────────────────────────────────────────────────────
{
  const items = [
    normalizeItem({ id: '1', name: 'Super Notes', url: 'https://1.com', description: 'Write fast', category: 'Productivity', tags: ['Markdown', 'Sync'], platform: 'iOS', alternativeTo: 'Evernote' }),
    normalizeItem({ id: '2', name: 'Vector Sketch', url: 'https://2.com', description: 'Design vectors', category: 'Design', tags: ['Vector'], platform: 'macOS', alternativeTo: 'Illustrator' }),
    normalizeItem({ id: '3', name: 'Cloud Sync', url: 'https://3.com', description: 'Backup notes and vectors', category: 'Productivity', tags: ['Sync', 'Cloud'], platform: 'Cross-Platform', alternativeTo: 'Dropbox' }),
  ];

  // Query search over name
  const byName = filterItems(items, { query: 'super' });
  assert.equal(byName.length, 1);
  assert.equal(byName[0].id, '1');

  // Query search over description
  const byDesc = filterItems(items, { query: 'vectors' });
  assert.equal(byDesc.length, 2);

  // Query search over alternativeTo
  const byAlt = filterItems(items, { query: 'evernote' });
  assert.equal(byAlt.length, 1);
  assert.equal(byAlt[0].id, '1');

  // Multi-word query (all tokens must match)
  const multiWord = filterItems(items, { query: 'notes fast' });
  assert.equal(multiWord.length, 1);
  assert.equal(multiWord[0].id, '1');

  // Tag chips filter (multi-select: must have all selected tags)
  const tagFilter = filterItems(items, { tags: ['Sync'] });
  assert.equal(tagFilter.length, 2);

  const multiTag = filterItems(items, { tags: ['Sync', 'Markdown'] });
  assert.equal(multiTag.length, 1);
  assert.equal(multiTag[0].id, '1');

  // Category filter
  const catFilter = filterItems(items, { category: 'Design' });
  assert.equal(catFilter.length, 1);
  assert.equal(catFilter[0].id, '2');

  // Platform filter
  const platFilter = filterItems(items, { platform: 'ios' });
  assert.equal(platFilter.length, 1);

  // Combined filters
  const combined = filterItems(items, { query: 'notes', category: 'Productivity', tags: ['Sync'] });
  assert.equal(combined.length, 2);
  console.log('✓ filterItems tests passed');
}

// ── 7. sortItems ─────────────────────────────────────────────────────────────
{
  const items = [
    normalizeItem({ id: 'c', name: 'Charlie', url: 'https://c.com', rating: 4.2, date: '2026-01-01' }),
    normalizeItem({ id: 'a', name: 'Alpha', url: 'https://a.com', rating: 4.9, date: '2026-05-01' }),
    normalizeItem({ id: 'b', name: 'Bravo', url: 'https://b.com', rating: 4.5, date: '2026-03-01' }),
  ];

  // A-Z
  const az = sortItems(items, 'name-asc');
  assert.deepEqual(az.map(i => i.name), ['Alpha', 'Bravo', 'Charlie']);

  // Z-A
  const za = sortItems(items, 'name-desc');
  assert.deepEqual(za.map(i => i.name), ['Charlie', 'Bravo', 'Alpha']);

  // Rating desc
  const ratingDesc = sortItems(items, 'rating-desc');
  assert.deepEqual(ratingDesc.map(i => i.name), ['Alpha', 'Bravo', 'Charlie']);

  // Newest
  const newest = sortItems(items, 'newest');
  assert.deepEqual(newest.map(i => i.name), ['Alpha', 'Bravo', 'Charlie']);
  console.log('✓ sortItems tests passed');
}

// ── 8. paginateItems ─────────────────────────────────────────────────────────
{
  const list = Array.from({ length: 120 }, (_, idx) => ({ id: `item-${idx}` }));
  const p1 = paginateItems(list, 50);
  assert.equal(p1.length, 50);
  assert.equal(p1[0].id, 'item-0');
  assert.equal(p1[49].id, 'item-49');

  const p2 = paginateItems(list, 100);
  assert.equal(p2.length, 100);
  console.log('✓ paginateItems tests passed');
}

// ── 9. URL State Management ──────────────────────────────────────────────────
{
  const searchStr = '?dev=fixtures&q=editor&tag=Markdown,Sync&category=Productivity&sort=rating-desc';
  const state = parseUrlState(searchStr);

  assert.equal(state.query, 'editor');
  assert.deepEqual(state.tags, ['Markdown', 'Sync']);
  assert.equal(state.category, 'Productivity');
  assert.equal(state.sort, 'rating-desc');

  // Preserves dev=fixtures when generating updated search params
  const updatedParams = buildUrlSearchParams(state, searchStr);
  assert.equal(updatedParams.get('dev'), 'fixtures');
  assert.equal(updatedParams.get('q'), 'editor');
  assert.equal(updatedParams.get('tag'), 'Markdown,Sync');
  assert.equal(updatedParams.get('category'), 'Productivity');
  assert.equal(updatedParams.get('sort'), 'rating-desc');
  console.log('✓ URL State tests passed');
}

// ── 10. Performance Benchmark: 5,000 items ───────────────────────────────────
{
  const categories = ['Productivity', 'Design', 'Development', 'Media', 'Utilities'];
  const platforms = ['iOS', 'Android', 'macOS', 'Windows', 'Web'];
  const sampleTags = ['Notes', 'Markdown', 'Sync', 'Cloud', 'Open Source', 'Privacy', 'Fast', 'Offline'];

  const largeDataset = [];
  for (let i = 0; i < 5000; i++) {
    const raw = {
      id: `item-${i}`,
      name: `Benchmark Tool ${i}`,
      url: `https://example.com/tool-${i}`,
      description: `Description for tool number ${i} which supports various workflows and features.`,
      category: categories[i % categories.length],
      platform: platforms[i % platforms.length],
      tags: [sampleTags[i % sampleTags.length], sampleTags[(i + 3) % sampleTags.length]],
      rating: 3.5 + (i % 15) / 10,
      alternativeTo: i % 4 === 0 ? 'Evernote' : (i % 4 === 1 ? 'Notion' : 'Slack'),
      date: '2026-06-15',
    };
    largeDataset.push(normalizeItem(raw));
  }

  assert.equal(largeDataset.length, 5000);

  const tStart = Date.now();
  const results = filterItems(largeDataset, {
    query: 'benchmark tool 4',
    category: 'Productivity',
    tags: ['Notes'],
  });
  const sorted = sortItems(results, 'rating-desc');
  const paginated = paginateItems(sorted, 50);
  const elapsed = Date.now() - tStart;

  assert.ok(paginated.length <= 50);
  assert.ok(elapsed < 50, `5,000-item query took ${elapsed}ms, must be < 50ms`);
  console.log(`✓ 5,000-item benchmark passed in ${elapsed}ms (threshold: 50ms)`);
}

console.log('--- All db-search tests passed successfully! ---');
