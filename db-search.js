/**
 * db-search.js — Reusable client-side database search and filter component
 * for TechFusion Report databases (Smartphone Apps, GTK Websites, AI Tools,
 * Open Source Alternatives).
 *
 * Pure helpers are exported for unit testing under Node. ESM module.
 */

// ── Pure helpers (exported for tests) ────────────────────────────────────────

/**
 * Sanitizes and validates a URL for security.
 * Upgrades http:// to https://, rejects non-https URLs, invalid protocols,
 * and unsafe strings (e.g. javascript:, data:, relative paths).
 * Returns safe https URL string or null if invalid.
 */
export function sanitizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (/^http:\/\//i.test(trimmed)) {
    candidate = 'https://' + trimmed.slice(7);
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Determines whether fixtures should be loaded.
 * Fixtures load ONLY when:
 * 1. The query string contains ?dev=fixtures
 * 2. location.hostname is NOT techfusionreport.com or www.techfusionreport.com
 */
export function isDevFixturesEnabled(searchParams, hostname = '') {
  let params;
  if (typeof searchParams === 'string') {
    params = new URLSearchParams(searchParams);
  } else if (searchParams instanceof URLSearchParams) {
    params = searchParams;
  } else {
    params = new URLSearchParams();
  }

  const dev = params.get('dev');
  const host = (hostname || '').toLowerCase();
  const isProdHost = host === 'techfusionreport.com' || host === 'www.techfusionreport.com';

  return dev === 'fixtures' && !isProdHost;
}

/**
 * Resolves the full URL to load the database JSON file.
 */
export function getDataUrl(dbName, options = {}) {
  const {
    dataBase = '/data/',
    searchParams = typeof window !== 'undefined' ? window.location.search : '',
    hostname = typeof window !== 'undefined' ? window.location.hostname : '',
  } = options;

  if (isDevFixturesEnabled(searchParams, hostname)) {
    return `/dev/fixtures/${dbName}.json`;
  }

  const base = dataBase.endsWith('/') ? dataBase : `${dataBase}/`;
  return `${base}${dbName}.json`;
}

/**
 * Normalizes a single raw item from the data contract.
 * Preserves required fields (id, name, url) and optional fields.
 * Precomputes search index string for high-speed sub-millisecond filtering.
 */
export function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null;

  const id = typeof item.id === 'string' ? item.id.trim() : String(item.id || '').trim();
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  const rawUrl = typeof item.url === 'string' ? item.url.trim() : '';

  if (!id || !name || !rawUrl) return null;

  const safeUrl = sanitizeUrl(rawUrl);

  const tags = Array.isArray(item.tags)
    ? item.tags.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim())
    : [];

  const category = typeof item.category === 'string' ? item.category.trim() : '';
  const description = typeof item.description === 'string' ? item.description.trim() : '';
  const platform = typeof item.platform === 'string' ? item.platform.trim() : '';
  const price = typeof item.price === 'string' || typeof item.price === 'number' ? String(item.price).trim() : '';
  const pricing = typeof item.pricing === 'string' ? item.pricing.trim() : '';
  const alternativeTo = typeof item.alternativeTo === 'string' ? item.alternativeTo.trim() : '';

  let rating = null;
  if (item.rating != null && item.rating !== '') {
    const num = Number(item.rating);
    if (!Number.isNaN(num) && num >= 0 && num <= 5) {
      rating = Math.round(num * 10) / 10;
    }
  }

  const date = typeof item.date === 'string' ? item.date.trim()
    : typeof item.updated === 'string' ? item.updated.trim() : '';

  // Precomputed lowercase search haystack for fast queries at 5,000+ items
  const _searchStr = [
    name,
    description,
    ...tags,
    alternativeTo,
    category,
    platform,
  ].filter(Boolean).join(' ').toLowerCase();

  return {
    id,
    name,
    url: safeUrl,
    rawUrl,
    description,
    category,
    tags,
    platform,
    price,
    pricing,
    rating,
    alternativeTo,
    date,
    _searchStr,
  };
}

/**
 * Normalizes raw dataset object.
 */
export function normalizeData(data) {
  if (!data || typeof data !== 'object') {
    return { updated: '', count: 0, items: [] };
  }

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.map(normalizeItem).filter(Boolean);

  return {
    updated: typeof data.updated === 'string' ? data.updated : '',
    count: items.length,
    items,
  };
}

/**
 * Extracts unique categories, platforms, and tags for filter controls.
 */
export function extractFilterOptions(items = []) {
  const categorySet = new Set();
  const platformSet = new Set();
  const tagCounts = new Map();

  for (const item of items) {
    if (item.category) categorySet.add(item.category);
    if (item.platform) {
      // Split comma-separated platforms e.g. "iOS, Android"
      item.platform.split(',').forEach(p => {
        const cleaned = p.trim();
        if (cleaned) platformSet.add(cleaned);
      });
    }
    if (Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }

  const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  const platforms = Array.from(platformSet).sort((a, b) => a.localeCompare(b));
  const tags = Array.from(tagCounts.keys()).sort((a, b) => a.localeCompare(b));

  return { categories, platforms, tags, tagCounts };
}

/**
 * Filters items based on query text, multi-select tag chips, category, and platform.
 */
export function filterItems(items = [], filters = {}) {
  const {
    query = '',
    tags = [],
    category = '',
    platform = '',
  } = filters;

  const normalizedTokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const activeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const activeCategory = category.trim();
  const activePlatform = platform.toLowerCase().trim();

  return items.filter(item => {
    // 1. Text search across name, description, tags, alternativeTo
    if (normalizedTokens.length > 0) {
      const matchAllTokens = normalizedTokens.every(token => item._searchStr.includes(token));
      if (!matchAllTokens) return false;
    }

    // 2. Tag filter chips (multi-select: item must have all selected tags)
    if (activeTags.length > 0) {
      const hasAllTags = activeTags.every(tag => item.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    // 3. Category filter
    if (activeCategory && item.category !== activeCategory) {
      return false;
    }

    // 4. Platform filter
    if (activePlatform) {
      if (!item.platform || !item.platform.toLowerCase().includes(activePlatform)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sorts items by name, rating, or newest.
 */
export function sortItems(items = [], sortBy = 'name-asc') {
  const list = [...items];

  switch (sortBy) {
    case 'name-desc':
      return list.sort((a, b) => b.name.localeCompare(a.name));

    case 'rating-desc':
      return list.sort((a, b) => {
        const rateA = a.rating != null ? a.rating : -1;
        const rateB = b.rating != null ? b.rating : -1;
        if (rateB !== rateA) return rateB - rateA;
        return a.name.localeCompare(b.name);
      });

    case 'newest':
      return list.sort((a, b) => {
        const timeA = a.date ? Date.parse(a.date) : 0;
        const timeB = b.date ? Date.parse(b.date) : 0;
        const validA = !Number.isNaN(timeA) ? timeA : 0;
        const validB = !Number.isNaN(timeB) ? timeB : 0;
        if (validB !== validA) return validB - validA;
        return a.name.localeCompare(b.name);
      });

    case 'name-asc':
    default:
      return list.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * Slices the filtered/sorted items for 50-card chunk pagination.
 */
export function paginateItems(items = [], limit = 50) {
  return items.slice(0, limit);
}

/**
 * Parses query state from URL search string (?q=&tag=&category=&platform=&sort=).
 */
export function parseUrlState(searchString = '') {
  const params = new URLSearchParams(searchString);
  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const platform = params.get('platform') || '';
  const sort = params.get('sort') || 'name-asc';

  // Support both ?tag=foo&tag=bar and ?tag=foo,bar
  const rawTags = params.getAll('tag');
  const tags = rawTags.flatMap(t => t.split(',')).map(t => t.trim()).filter(Boolean);

  return { query, tags, category, platform, sort };
}

/**
 * Builds updated URLSearchParams preserving other existing parameters (such as dev=fixtures).
 */
export function buildUrlSearchParams(currentState, existingSearchString = '') {
  const params = new URLSearchParams(existingSearchString);

  // Clear component query keys first
  params.delete('q');
  params.delete('tag');
  params.delete('category');
  params.delete('platform');
  params.delete('sort');

  if (currentState.query && currentState.query.trim()) {
    params.set('q', currentState.query.trim());
  }

  if (Array.isArray(currentState.tags) && currentState.tags.length > 0) {
    params.set('tag', currentState.tags.join(','));
  }

  if (currentState.category && currentState.category.trim()) {
    params.set('category', currentState.category.trim());
  }

  if (currentState.platform && currentState.platform.trim()) {
    params.set('platform', currentState.platform.trim());
  }

  if (currentState.sort && currentState.sort !== 'name-asc') {
    params.set('sort', currentState.sort);
  }

  return params;
}

// ═════════════════════════════════════════════════════════════════════════════
// Browser Execution Guard (Runs only when loaded in browser)
// ═════════════════════════════════════════════════════════════════════════════

if (typeof document !== 'undefined') {
  const PAGE_SIZE = 50;
  const DEBOUNCE_MS = 150;

  /**
   * Helper to map pathnames or topic slugs to database name
   */
  function resolveDbName(container) {
    if (container?.dataset?.db) return container.dataset.db;
    if (document.body.dataset.db) return document.body.dataset.db;

    const topic = document.body.dataset.topic;
    if (topic === 'smartphone_apps' || topic === 'smartphone-apps') return 'smartphone-apps';
    if (topic === 'gtk_websites' || topic === 'gtk-websites') return 'gtk-websites';
    if (topic === 'ai' || topic === 'ai-tools') return 'ai-tools';
    if (topic === 'open-source-alternatives' || topic === 'open_source_alternatives') return 'open-source-alternatives';

    const path = window.location.pathname.toLowerCase();
    if (path.includes('smartphone-apps')) return 'smartphone-apps';
    if (path.includes('gtk_websites') || path.includes('gtk-websites')) return 'gtk-websites';
    if (path.includes('ai.html') || path.includes('/ai')) return 'ai-tools';
    if (path.includes('open-source-alternatives')) return 'open-source-alternatives';

    return 'ai-tools';
  }

  /**
   * Main component mount function
   */
  async function initDbSearch() {
    const container = document.querySelector('#db-search-container') ||
      document.querySelector('#db-search') ||
      document.querySelector('.db-search-section');

    if (!container) return;

    const dbName = resolveDbName(container);
    const metaDataBase = document.querySelector('meta[name="tfr-data-base"]')?.getAttribute('content') || '/data/';

    // Internal state
    let allItems = [];
    let filterOptions = { categories: [], platforms: [], tags: [], tagCounts: new Map() };
    let filteredItems = [];
    let renderedCount = PAGE_SIZE;
    let debounceTimer = null;

    let state = parseUrlState(window.location.search);

    // Create Root DOM Shell
    container.innerHTML = ''; // safe: clear previous static or placeholder content
    const root = document.createElement('div');
    root.className = 'db-search-root';
    container.appendChild(root);

    // Initial Loading State
    const loadingEl = document.createElement('div');
    loadingEl.className = 'db-state-message db-loading-state';
    loadingEl.setAttribute('role', 'status');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'db-spinner';
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Loading database...';
    loadingEl.appendChild(loadingSpinner);
    loadingEl.appendChild(loadingText);
    root.appendChild(loadingEl);

    // Fetch data with error handling
    const dataUrl = getDataUrl(dbName, {
      dataBase: metaDataBase,
      searchParams: window.location.search,
      hostname: window.location.hostname,
    });

    try {
      const response = await fetch(dataUrl, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading ${dataUrl}`);
      }
      const rawJson = await response.json();
      const normalized = normalizeData(rawJson);
      allItems = normalized.items;
      filterOptions = extractFilterOptions(allItems);
    } catch (err) {
      root.innerHTML = '';
      const errorEl = document.createElement('div');
      errorEl.className = 'db-state-message db-error-state';
      errorEl.setAttribute('role', 'alert');

      const errorHeading = document.createElement('h3');
      errorHeading.textContent = 'Unable to Load Database';

      const errorDesc = document.createElement('p');
      errorDesc.textContent = 'We encountered an issue loading database records. Please verify your connection or try again shortly.';

      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'db-btn db-btn-primary';
      retryBtn.textContent = 'Retry';
      retryBtn.addEventListener('click', () => initDbSearch());

      errorEl.appendChild(errorHeading);
      errorEl.appendChild(errorDesc);
      errorEl.appendChild(retryBtn);
      root.appendChild(errorEl);
      return;
    }

    // Clear loading state
    root.innerHTML = '';

    // ── Build Search UI Controls ─────────────────────────────────────────────
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'db-controls';

    // 1. Search Bar & Row
    const searchRow = document.createElement('div');
    searchRow.className = 'db-search-row';

    const searchInputGroup = document.createElement('div');
    searchInputGroup.className = 'db-input-group db-search-input-group';

    const searchLabel = document.createElement('label');
    searchLabel.htmlFor = 'db-search-input';
    searchLabel.className = 'db-label visually-hidden';
    searchLabel.textContent = 'Search database';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.id = 'db-search-input';
    searchInput.className = 'db-search-input';
    searchInput.placeholder = 'Search by name, description, tags, alternatives...';
    searchInput.value = state.query;
    searchInput.setAttribute('autocomplete', 'off');

    const clearSearchBtn = document.createElement('button');
    clearSearchBtn.type = 'button';
    clearSearchBtn.className = 'db-clear-search-btn';
    clearSearchBtn.setAttribute('aria-label', 'Clear search query');
    clearSearchBtn.textContent = '✕';
    clearSearchBtn.hidden = !state.query;

    searchInputGroup.appendChild(searchLabel);
    searchInputGroup.appendChild(searchInput);
    searchInputGroup.appendChild(clearSearchBtn);
    searchRow.appendChild(searchInputGroup);

    // 2. Select Dropdowns Row (Category, Platform, Sort)
    const filtersRow = document.createElement('div');
    filtersRow.className = 'db-filters-row';

    // Category Select (if categories exist)
    let categorySelect = null;
    if (filterOptions.categories.length > 0) {
      const catGroup = document.createElement('div');
      catGroup.className = 'db-select-group';

      const catLabel = document.createElement('label');
      catLabel.htmlFor = 'db-category-select';
      catLabel.className = 'db-label';
      catLabel.textContent = 'Category';

      categorySelect = document.createElement('select');
      categorySelect.id = 'db-category-select';
      categorySelect.className = 'db-select';

      const allCatOption = document.createElement('option');
      allCatOption.value = '';
      allCatOption.textContent = 'All Categories';
      categorySelect.appendChild(allCatOption);

      for (const cat of filterOptions.categories) {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        if (state.category === cat) option.selected = true;
        categorySelect.appendChild(option);
      }

      catGroup.appendChild(catLabel);
      catGroup.appendChild(categorySelect);
      filtersRow.appendChild(catGroup);
    }

    // Platform Select (if platforms exist)
    let platformSelect = null;
    if (filterOptions.platforms.length > 0) {
      const platGroup = document.createElement('div');
      platGroup.className = 'db-select-group';

      const platLabel = document.createElement('label');
      platLabel.htmlFor = 'db-platform-select';
      platLabel.className = 'db-label';
      platLabel.textContent = 'Platform';

      platformSelect = document.createElement('select');
      platformSelect.id = 'db-platform-select';
      platformSelect.className = 'db-select';

      const allPlatOption = document.createElement('option');
      allPlatOption.value = '';
      allPlatOption.textContent = 'All Platforms';
      platformSelect.appendChild(allPlatOption);

      for (const plat of filterOptions.platforms) {
        const option = document.createElement('option');
        option.value = plat;
        option.textContent = plat;
        if (state.platform === plat) option.selected = true;
        platformSelect.appendChild(option);
      }

      platGroup.appendChild(platLabel);
      platGroup.appendChild(platformSelect);
      filtersRow.appendChild(platGroup);
    }

    // Sort Select
    const sortGroup = document.createElement('div');
    sortGroup.className = 'db-select-group';

    const sortLabel = document.createElement('label');
    sortLabel.htmlFor = 'db-sort-select';
    sortLabel.className = 'db-label';
    sortLabel.textContent = 'Sort by';

    const sortSelect = document.createElement('select');
    sortSelect.id = 'db-sort-select';
    sortSelect.className = 'db-select';

    const sortOptionsList = [
      { value: 'name-asc', label: 'Name (A–Z)' },
      { value: 'name-desc', label: 'Name (Z–A)' },
      { value: 'rating-desc', label: 'Highest Rated' },
      { value: 'newest', label: 'Newest Added' },
    ];

    for (const opt of sortOptionsList) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (state.sort === opt.value) option.selected = true;
      sortSelect.appendChild(option);
    }

    sortGroup.appendChild(sortLabel);
    sortGroup.appendChild(sortSelect);
    filtersRow.appendChild(sortGroup);

    searchRow.appendChild(filtersRow);
    controlsContainer.appendChild(searchRow);

    // 3. Tag Filter Chips
    let tagChipsContainer = null;
    const tagButtonsMap = new Map();

    if (filterOptions.tags.length > 0) {
      tagChipsContainer = document.createElement('div');
      tagChipsContainer.className = 'db-tag-chips-wrapper';

      const tagChipsLabel = document.createElement('span');
      tagChipsLabel.className = 'db-chips-label';
      tagChipsLabel.textContent = 'Filter by tag:';
      tagChipsContainer.appendChild(tagChipsLabel);

      const tagChipsList = document.createElement('div');
      tagChipsList.className = 'db-tag-chips';
      tagChipsList.setAttribute('role', 'group');
      tagChipsList.setAttribute('aria-label', 'Filter items by tag');

      for (const tag of filterOptions.tags) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'db-tag-chip';
        chip.textContent = tag;
        const isSelected = state.tags.includes(tag);
        chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        if (isSelected) chip.classList.add('active');

        chip.addEventListener('click', () => {
          const index = state.tags.indexOf(tag);
          if (index >= 0) {
            state.tags.splice(index, 1);
            chip.setAttribute('aria-pressed', 'false');
            chip.classList.remove('active');
          } else {
            state.tags.push(tag);
            chip.setAttribute('aria-pressed', 'true');
            chip.classList.add('active');
          }
          renderedCount = PAGE_SIZE;
          syncStateAndRender();
        });

        tagButtonsMap.set(tag, chip);
        tagChipsList.appendChild(chip);
      }

      tagChipsContainer.appendChild(tagChipsList);
      controlsContainer.appendChild(tagChipsContainer);
    }

    root.appendChild(controlsContainer);

    // ── Results Summary Bar (Result count in aria-live) ──────────────────────
    const resultsBar = document.createElement('div');
    resultsBar.className = 'db-results-bar';

    const resultCount = document.createElement('div');
    resultCount.className = 'db-result-count';
    resultCount.setAttribute('role', 'status');
    resultCount.setAttribute('aria-live', 'polite');

    const clearAllBtn = document.createElement('button');
    clearAllBtn.type = 'button';
    clearAllBtn.className = 'db-clear-all-btn';
    clearAllBtn.textContent = 'Clear all filters';
    clearAllBtn.hidden = true;

    clearAllBtn.addEventListener('click', () => {
      state.query = '';
      state.tags = [];
      state.category = '';
      state.platform = '';
      state.sort = 'name-asc';
      searchInput.value = '';
      clearSearchBtn.hidden = true;
      if (categorySelect) categorySelect.value = '';
      if (platformSelect) platformSelect.value = '';
      sortSelect.value = 'name-asc';

      for (const [, chip] of tagButtonsMap) {
        chip.setAttribute('aria-pressed', 'false');
        chip.classList.remove('active');
      }

      renderedCount = PAGE_SIZE;
      syncStateAndRender();
    });

    resultsBar.appendChild(resultCount);
    resultsBar.appendChild(clearAllBtn);
    root.appendChild(resultsBar);

    // ── Cards Grid Container ─────────────────────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'db-grid';
    grid.setAttribute('role', 'region');
    grid.setAttribute('aria-label', 'Database item results');
    root.appendChild(grid);

    // ── Empty State Container ────────────────────────────────────────────────
    const emptyState = document.createElement('div');
    emptyState.className = 'db-state-message db-empty-state';
    emptyState.hidden = true;

    const emptyHeading = document.createElement('h3');
    emptyHeading.textContent = 'No matching items found';

    const emptyDesc = document.createElement('p');
    emptyDesc.textContent = 'Try adjusting your search terms, removing filters, or clearing your current selection.';

    const emptyResetBtn = document.createElement('button');
    emptyResetBtn.type = 'button';
    emptyResetBtn.className = 'db-btn db-btn-secondary';
    emptyResetBtn.textContent = 'Clear all filters';
    emptyResetBtn.addEventListener('click', () => clearAllBtn.click());

    emptyState.appendChild(emptyHeading);
    emptyState.appendChild(emptyDesc);
    emptyState.appendChild(emptyResetBtn);
    root.appendChild(emptyState);

    // ── Pagination / Show More ───────────────────────────────────────────────
    const pagination = document.createElement('div');
    pagination.className = 'db-pagination';

    const showMoreBtn = document.createElement('button');
    showMoreBtn.type = 'button';
    showMoreBtn.className = 'db-btn db-btn-primary db-show-more-btn';
    pagination.appendChild(showMoreBtn);
    root.appendChild(pagination);

    showMoreBtn.addEventListener('click', () => {
      const prevRendered = renderedCount;
      renderedCount += PAGE_SIZE;
      appendCards(prevRendered, renderedCount);
      updatePagination();
      updateResultCount();
    });

    // ── Card Rendering Helper (Strict createElement / textContent) ───────────
    function createCardElement(item) {
      const card = document.createElement('article');
      card.className = 'db-card';
      card.setAttribute('data-id', item.id);

      // Card Header: Badges
      const badgesContainer = document.createElement('div');
      badgesContainer.className = 'db-card-badges';

      if (item.category) {
        const catBadge = document.createElement('span');
        catBadge.className = 'db-badge db-badge-category';
        catBadge.textContent = item.category;
        badgesContainer.appendChild(catBadge);
      }

      if (item.rating != null) {
        const ratingBadge = document.createElement('span');
        ratingBadge.className = 'db-badge db-badge-rating';
        ratingBadge.textContent = `★ ${item.rating.toFixed(1)}`;
        badgesContainer.appendChild(ratingBadge);
      }

      if (item.price || item.pricing) {
        const priceBadge = document.createElement('span');
        priceBadge.className = 'db-badge db-badge-price';
        priceBadge.textContent = item.pricing && item.price && item.pricing !== item.price
          ? `${item.pricing} • ${item.price}`
          : (item.pricing || item.price);
        badgesContainer.appendChild(priceBadge);
      }

      if (badgesContainer.children.length > 0) {
        card.appendChild(badgesContainer);
      }

      // Title & Link
      const title = document.createElement('h3');
      title.className = 'db-card-title';

      if (item.url) {
        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'db-card-link';
        link.textContent = item.name;
        title.appendChild(link);
      } else {
        const titleText = document.createElement('span');
        titleText.className = 'db-card-title-plain';
        titleText.textContent = item.name;
        title.appendChild(titleText);
      }
      card.appendChild(title);

      // Platform (if present)
      if (item.platform) {
        const platformEl = document.createElement('div');
        platformEl.className = 'db-card-platform';
        const platformLabel = document.createElement('span');
        platformLabel.className = 'db-platform-label';
        platformLabel.textContent = 'Platform: ';
        const platformValue = document.createElement('span');
        platformValue.className = 'db-platform-value';
        platformValue.textContent = item.platform;
        platformEl.appendChild(platformLabel);
        platformEl.appendChild(platformValue);
        card.appendChild(platformEl);
      }

      // Description (if present)
      if (item.description) {
        const desc = document.createElement('p');
        desc.className = 'db-card-description';
        desc.textContent = item.description;
        card.appendChild(desc);
      }

      // Alternative To (if present)
      if (item.alternativeTo) {
        const altEl = document.createElement('div');
        altEl.className = 'db-card-alternative';
        const altLabel = document.createElement('span');
        altLabel.className = 'db-alt-label';
        altLabel.textContent = 'Alternative to: ';
        const altValue = document.createElement('span');
        altValue.className = 'db-alt-value';
        altValue.textContent = item.alternativeTo;
        altEl.appendChild(altLabel);
        altEl.appendChild(altValue);
        card.appendChild(altEl);
      }

      // Tags (if present)
      if (item.tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'db-card-tags';
        for (const tag of item.tags) {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'db-card-tag';
          tagSpan.textContent = tag;
          tagsContainer.appendChild(tagSpan);
        }
        card.appendChild(tagsContainer);
      }

      // Card Action Footer (if URL is valid)
      if (item.url) {
        const footer = document.createElement('div');
        footer.className = 'db-card-footer';
        const actionBtn = document.createElement('a');
        actionBtn.href = item.url;
        actionBtn.target = '_blank';
        actionBtn.rel = 'noopener noreferrer';
        actionBtn.className = 'db-card-action-btn';
        actionBtn.textContent = 'Visit ↗';
        footer.appendChild(actionBtn);
        card.appendChild(footer);
      }

      return card;
    }

    // ── Appending / Updating Card Grid ───────────────────────────────────────
    function appendCards(start, end) {
      const fragment = document.createDocumentFragment();
      const slice = filteredItems.slice(start, end);
      for (const item of slice) {
        fragment.appendChild(createCardElement(item));
      }
      grid.appendChild(fragment);
    }

    function updatePagination() {
      const remaining = Math.max(0, filteredItems.length - renderedCount);
      if (remaining > 0) {
        pagination.hidden = false;
        showMoreBtn.textContent = `Show more (${remaining} remaining)`;
      } else {
        pagination.hidden = true;
      }
    }

    function updateResultCount() {
      const visible = Math.min(renderedCount, filteredItems.length);
      const total = filteredItems.length;

      if (total === 0) {
        resultCount.textContent = '0 items found';
      } else if (visible < total) {
        resultCount.textContent = `Showing ${visible} of ${total} items`;
      } else {
        resultCount.textContent = `Showing all ${total} items`;
      }

      const hasActiveFilters = Boolean(
        state.query.trim() ||
        state.tags.length > 0 ||
        state.category ||
        state.platform ||
        state.sort !== 'name-asc'
      );
      clearAllBtn.hidden = !hasActiveFilters;
    }

    function syncStateAndRender(updateUrl = true) {
      if (updateUrl) {
        const newParams = buildUrlSearchParams(state, window.location.search);
        const newSearch = newParams.toString();
        const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`;
        window.history.replaceState({}, '', newUrl);
      }

      // 1. Filter
      const matched = filterItems(allItems, state);

      // 2. Sort
      filteredItems = sortItems(matched, state.sort);

      // 3. Render
      grid.innerHTML = '';
      if (filteredItems.length === 0) {
        emptyState.hidden = false;
        pagination.hidden = true;
      } else {
        emptyState.hidden = true;
        appendCards(0, renderedCount);
        updatePagination();
      }

      updateResultCount();
    }

    // ── Event Handlers ───────────────────────────────────────────────────────

    // Debounced search input (~150ms)
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      clearSearchBtn.hidden = !searchInput.value.trim();
      debounceTimer = setTimeout(() => {
        state.query = searchInput.value.trim();
        renderedCount = PAGE_SIZE;
        syncStateAndRender();
      }, DEBOUNCE_MS);
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.hidden = true;
      state.query = '';
      renderedCount = PAGE_SIZE;
      syncStateAndRender();
      searchInput.focus();
    });

    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        state.category = categorySelect.value;
        renderedCount = PAGE_SIZE;
        syncStateAndRender();
      });
    }

    if (platformSelect) {
      platformSelect.addEventListener('change', () => {
        state.platform = platformSelect.value;
        renderedCount = PAGE_SIZE;
        syncStateAndRender();
      });
    }

    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      renderedCount = PAGE_SIZE;
      syncStateAndRender();
    });

    // Support browser Back/Forward navigation
    window.addEventListener('popstate', () => {
      state = parseUrlState(window.location.search);
      searchInput.value = state.query;
      clearSearchBtn.hidden = !state.query;
      if (categorySelect) categorySelect.value = state.category;
      if (platformSelect) platformSelect.value = state.platform;
      sortSelect.value = state.sort;

      for (const [tag, chip] of tagButtonsMap) {
        const isSelected = state.tags.includes(tag);
        chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        chip.classList.toggle('active', isSelected);
      }

      renderedCount = PAGE_SIZE;
      syncStateAndRender(false);
    });

    // Initial render
    syncStateAndRender(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDbSearch);
  } else {
    initDbSearch();
  }
}
