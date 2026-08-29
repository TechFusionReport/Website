(async function () {
  const topicKey = document.body.dataset.topic;
  const topic = window.TFR_TOPIC_DATA && window.TFR_TOPIC_DATA[topicKey];
  const root = document.getElementById("topic-root");
  if (!topic || !root) return;

  const nav = window.TFR_RENDER_NAV ? window.TFR_RENDER_NAV(topic.className) : "";
  const footer = `<footer class="site-footer"><img src="https://www.techfusionreport.com/graphics/tfr-logo-clean_transparent.png" alt="TechFusion Report"><p>Technology, entertainment, and productivity without the filler.</p><div><a href="/technology.html">Technology</a><a href="/entertainment.html">Entertainment</a><a href="/productivity.html">Productivity</a><a href="/blog.html">Blog</a><a href="/about.html">About</a><a href="/contact.html">Contact</a></div></footer>`;

  let posts = [];
  try {
    const response = await fetch("/posts.json");
    posts = response.ok ? await response.json() : [];
  } catch (error) {
    posts = [];
  }

  const exact = posts.filter((post) => (post.subcategory || "").toLowerCase() === topic.title.toLowerCase());
  const cards = exact.slice(0, 6);
  const postCards = cards.map((post, index) => `<article class="post-card ${topic.className} ${index === 0 ? "feature-card" : ""}"><a href="${post.url}"><img class="post-thumb" src="${post.image || post.thumbnail || topic.image}" alt=""><span class="label">${post.category}</span><h3>${post.title}</h3><p>${post.excerpt}</p><div class="meta"><span>${post.subcategory || topic.title}</span><span>${formatDate(post.date)}</span><span>${post.readTime || ""}</span></div></a></article>`).join("");
  const tags = topic.tags.map((tag) => `<span>${tag}</span>`).join("");
  const related = topic.parent === "Technology"
    ? [["AI Tools", "/ai.html"], ["Smartphones", "/smartphones.html"], ["Smart Home", "/smart_home.html"], ["Android Apps", "/android_apps.html"], ["Mac Apps", "/mac-apps.html"], ["Smartphone Apps", "/smartphone-apps.html"], ["Tips & Tricks", "/tips_tricks.html"], ["Good to Know Websites", "/gtk_websites.html"]]
    : topic.parent === "Entertainment"
      ? [["Movies", "/movies.html"], ["TV Shows", "/tv_shows.html"], ["Music", "/music.html"]]
      : [["Office Tools", "/office.html"], ["Workflows", "/workflows.html"], ["Productivity Apps", "/productivity_apps.html"]];
  const relatedLinks = related.filter(([label]) => label !== topic.title).map(([label, url]) => `<a href="${url}">${label}<span>${topic.parent}</span></a>`).join("");

  document.title = `${topic.title} | TechFusion Report`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", topic.description);

  const articles = cards.length ? `<section class="section-head"><span class="eyebrow">Latest ${topic.title}</span><h2>Stories in this lane</h2><p>Fresh posts are pulled from the publishing index for this topic.</p></section><section class="magazine-grid">${postCards}</section>` : "";
  root.innerHTML = `${nav}<div class="ticker"><span>Latest</span><p>AI tools reshape daily workflows</p><p>iPhone Air field test published</p><p>Streaming needs sharper releases</p></div><main id="main-content"><section class="category-hero ${topic.className} pcb-panel"><div><nav class="breadcrumbs"><a href="/">Home</a> / <a href="${topic.parentUrl}">${topic.parent}</a> / ${topic.title}</nav><span class="eyebrow">${topic.parent}</span><h1>${topic.title}</h1><p>${topic.description}</p></div><img src="${topic.art || topic.image}" alt="${topic.title}"></section><section class="subtopic-strip">${tags}</section>${articles}<section class="section-head"><span class="eyebrow">More ${topic.parent}</span><h2>Keep exploring</h2></section><section class="category-blog-index">${relatedLinks}</section></main>${footer}`;

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
}());
