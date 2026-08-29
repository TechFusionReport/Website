(function () {
  const groups = [
    {
      label: "Technology",
      href: "/technology.html",
      className: "technology",
      items: [
        ["AI Tools", "/ai.html", "/graphics/png-final/ai_tools_nb.png"],
        ["Smartphones", "/smartphones.html", "/graphics/smartphones_800x320.webp"],
        ["Smart Home", "/smart_home.html", "/graphics/png-final/smart_home_nb.png"],
        ["Android Apps", "/android_apps.html", "/graphics/android-apps_transparent.png"],
        ["Mac Apps", "/mac-apps.html", "/graphics/png-final/mac_apps_nb.png"],
        ["Smartphone Apps", "/smartphone-apps.html", "/graphics/png-final/smartphone_apps__nb.png"],
        ["Tips & Tricks", "/tips_tricks.html", "/graphics/png-final/tips_n_tricks_nb.png"],
        ["Good to Know Websites", "/gtk_websites.html", "/graphics/png-final/gtk_websites_nb.png"]
      ]
    },
    {
      label: "Entertainment",
      href: "/entertainment.html",
      className: "entertainment",
      items: [
        ["Movies", "/movies.html", "/graphics/movies_transparent.png"],
        ["TV Shows", "/tv_shows.html", "/graphics/tv-shows_transparent.png"],
        ["Music", "/music.html", "/graphics/music_transparent.png"]
      ]
    },
    {
      label: "Productivity",
      href: "/productivity.html",
      className: "productivity",
      items: [
        ["Office Tools", "/office.html", "/graphics/desksteps_transparent.png"],
        ["Workflows", "/workflows.html", "/graphics/workflows_transparent.png"],
        ["Productivity Apps", "/productivity_apps.html", "/graphics/productivity-apps_transparent.png"]
      ]
    }
  ];

  window.TFR_RENDER_NAV = function renderNav(active = "") {
    return `<header class="site-header"><a class="brand" href="/" aria-label="TechFusion Report home"><img src="/graphics/png-final/tfr_header_logo.png" alt="TechFusion Report"></a><nav class="primary-nav" aria-label="Primary"><a class="nav-link home ${active === "home" ? "active" : ""}" href="/">Home</a>${groups.map((group) => `<span class="nav-group ${group.className}"><a class="nav-link ${group.className} ${active === group.className ? "active" : ""}" href="${group.href}">${group.label}</a><span class="nav-panel" aria-label="${group.label} subcategories">${group.items.map(([label, href, image]) => `<a class="nav-card" href="${href}" aria-label="${label}" title="${label}"><img src="${image}" alt=""></a>`).join("")}</span></span>`).join("")}<a class="nav-link blog ${active === "blog" ? "active" : ""}" href="/blog.html">Blog</a></nav></header>`;
  };

  const current = location.pathname;
  const active = current === "/" || current.endsWith("/index.html")
    ? "home"
    : current.includes("entertainment") || ["/movies.html", "/tv_shows.html", "/music.html"].includes(current)
      ? "entertainment"
      : current.includes("productivity") || ["/office.html", "/workflows.html"].includes(current)
        ? "productivity"
        : current.includes("blog")
          ? "blog"
          : current.includes("technology") || ["/ai.html", "/smartphones.html", "/smart_home.html", "/android_apps.html", "/mac-apps.html", "/smartphone-apps.html", "/tips_tricks.html", "/gtk_websites.html"].includes(current)
            ? "technology"
            : "";

  const header = document.querySelector(".site-header");
  if (header) header.outerHTML = window.TFR_RENDER_NAV(active);
}());
