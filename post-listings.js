(async function () {
  const main = document.querySelector('main');
  const carousel = main?.querySelector('.latest-carousel:not([data-curated])');
  const grid = main?.querySelector('.magazine-grid');
  if (!carousel && !grid) return;
  const categories = ['Technology', 'Entertainment', 'Productivity'];
  const clean = (value) => typeof value === 'string' ? value.trim() : '';
  const usable = (value) => clean(value) && !/populates here|\{\{|\[placeholder\]/i.test(value);
  const decode = (value) => {
    const element = document.createElement('textarea');
    element.innerHTML = clean(value).replace(/</g, '&lt;');
    return element.value;
  };
  const safeURL = (value, local = false) => {
    try {
      if (!clean(value)) return '';
      const url = new URL(value, location.origin);
      if (!['https:', 'http:'].includes(url.protocol)) return '';
      if (local && ![location.hostname, 'techfusionreport.com', 'www.techfusionreport.com'].includes(url.hostname)) return '';
      return local ? url.pathname : url.href;
    } catch { return ''; }
  };
  const topic = document.body.dataset.topic;
  const heading = main.querySelector('h1')?.textContent.trim();
  const category = categories.includes(heading) ? heading : '';
  const warnings = [];
  try {
    const response = await fetch('/posts.json', { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Index HTTP ${response.status}`);
    const records = await response.json();
    if (!Array.isArray(records)) throw new Error('Expected a post array');
    const posts = (await Promise.all(records.map(async (record, position) => {
      if (!record || typeof record !== 'object') return null;
      const issues = [];
      let url = /^\d{4}-\d{2}-\d{2}-[^/\\]+\.html$/.test(clean(record.file))
        ? `/_posts/${record.file}` : safeURL(record.url, true);
      if (!/^\/_posts\/[^/]+\.html$/.test(url) || url.includes('..')) {
        warnings.push({ position, issues: ['Missing safe published HTML path'] });
        return null;
      }
      let article;
      try {
        const result = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
        if (!result.ok) throw new Error(`HTTP ${result.status}`);
        article = new DOMParser().parseFromString(await result.text(), 'text/html');
      } catch (error) { issues.push(`Article metadata unavailable: ${error.message}`); }
      const text = (selector) => clean(article?.querySelector(selector)?.textContent);
      const attribute = (selector, name) => clean(article?.querySelector(selector)?.getAttribute(name));
      let title = decode(record.title);
      if (!usable(title) || title === record.slug || /^[a-z0-9]+(?:-[a-z0-9]+){2,}$/.test(title)) {
        issues.push('Missing or raw-slug title');
        title = text('h1');
      }
      if (!usable(title)) title = 'Read article';
      let description = decode(record.excerpt || record.description);
      if (!usable(description)) {
        issues.push('Missing or placeholder description');
        description = text('.dek') || attribute('meta[name="description"]', 'content');
      }
      if (!usable(description)) description = '';
      const articleCategory = attribute('article[data-category]', 'data-category') ||
        attribute('meta[property="article:section"]', 'content') ||
        text('.breadcrumbs a[href="/technology.html"], .breadcrumbs a[href="/entertainment.html"], .breadcrumbs a[href="/productivity.html"]');
      let section = clean(record.category);
      if (categories.includes(articleCategory) && section !== articleCategory) {
        issues.push(`Category conflicts with article: ${section} → ${articleCategory}`);
        section = articleCategory;
      }
      if (!categories.includes(section)) { issues.push('Unknown category'); section = ''; }
      const breadcrumbs = text('.breadcrumbs');
      const subcategory = clean(record.subcategory) || attribute('article[data-section]', 'data-section') ||
        clean(breadcrumbs.split('/').pop());
      let image = safeURL(record.thumbnail || record.image);
      if (!image) {
        issues.push('Missing or unsafe image');
        image = safeURL(attribute('.article-image', 'src') || attribute('meta[property="og:image"]', 'content'));
      }
      const date = /^\d{4}-\d{2}-\d{2}$/.test(clean(record.date)) &&
        !Number.isNaN(Date.parse(record.date)) && new Date(record.date).toISOString().slice(0, 10) === record.date ? record.date : '';
      if (!date) issues.push('Missing or invalid date');
      if (issues.length) warnings.push({ url, issues });
      return { url, title, description, category: section, subcategory, image, date, position,
        readTime: clean(record.readTime) || text('.reading-time') ||
          [...(article?.querySelectorAll('.article-meta span') || [])].map(element => element.textContent).find(value => /min read/.test(value)) || '' };
    }))).filter(Boolean).sort((first, second) => second.date.localeCompare(first.date) || first.position - second.position);
    const unique = posts.filter((post, position) => posts.findIndex(other => other.url === post.url) === position);
    const selected = unique.filter(post => (!category || post.category === category) &&
      (!topic || post.subcategory === heading));
    const element = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    };
    const target = carousel || grid;
    const fragment = document.createDocumentFragment();
    for (const [position, post] of (carousel ? selected.slice(0, 9) : selected).entries()) {
      const card = element('article', `${carousel ? 'carousel-card' : 'post-card'} ${post.category.toLowerCase()}${!carousel && position === 0 ? ' feature-card' : ''}`);
      const link = element('a');
      link.href = post.url;
      if (post.image) {
        const image = element('img', carousel ? '' : 'post-thumb');
        image.src = post.image;
        image.alt = '';
        image.loading = 'lazy';
        image.addEventListener('error', () => image.remove(), { once: true });
        link.append(image);
      }
      link.append(element('span', 'label', post.category), element('h3', '', post.title));
      if (post.description) link.append(element('p', '', post.description));
      const meta = element('div', 'meta');
      if (post.subcategory) meta.append(element('span', '', post.subcategory));
      if (post.date) {
        const time = element('time', '', new Date(`${post.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }));
        time.dateTime = post.date;
        meta.append(time);
      }
      if (post.readTime) meta.append(element('span', '', post.readTime));
      link.append(meta);
      card.append(link);
      fragment.append(card);
    }
    if (!selected.length) fragment.append(element('p', '', 'No articles published in this section yet.'));
    target.replaceChildren(fragment);
    if (category) {
      const index = main.querySelector('.category-blog-index');
      if (index) index.replaceChildren(...selected.map(post => {
        const link = element('a', '', post.title);
        link.href = post.url;
        link.append(element('span', '', post.subcategory));
        return link;
      }));
    }
    target.dataset.listingsReady = 'true';
    target.dispatchEvent(new Event('scroll'));
    if (warnings.length) console.warn('TFR post metadata requires review', warnings);
  } catch (error) {
    console.warn('TFR listings unavailable; retaining published HTML', error);
  }
}());
