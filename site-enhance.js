(function () {
  const categories = [
    {
      title: "Technology",
      href: "/technology.html",
      className: "technology",
      image: "/graphics/png-final/tech_nb.png",
      copy: "Start here for practical reads on devices, apps, AI tools, and smart-home gear that can actually make daily life easier.",
      topics: [
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
      title: "Entertainment",
      href: "/entertainment.html",
      className: "entertainment",
      image: "/graphics/png-final/ent.png",
      copy: "Find what is worth watching, listening to, or streaming next without digging through endless lists and noisy recommendations.",
      topics: [
        ["Movies", "/movies.html", "/graphics/movies_transparent.png"],
        ["TV Shows", "/tv_shows.html", "/graphics/tv-shows_transparent.png"],
        ["Music", "/music.html", "/graphics/music_transparent.png"]
      ]
    },
    {
      title: "Productivity",
      href: "/productivity.html",
      className: "productivity",
      image: "/graphics/png-final/prod_nb.png",
      copy: "Build smoother workdays with apps, office tools, and simple systems that help you get back to the thing you meant to do.",
      topics: [
        ["Office Tools", "/office.html", "/graphics/desksteps_transparent.png"],
        ["Workflows", "/workflows.html", "/graphics/workflows_transparent.png"],
        ["Productivity Apps", "/productivity_apps.html", "/graphics/productivity-apps_transparent.png"]
      ]
    }
  ];

  const path = location.pathname;
  if (path === "/" || path.endsWith("/index.html")) addHomeCards();
  addCategoryTopicCards();
  initCarouselAccent();

  function addHomeCards() {
    const hero = document.querySelector(".hero");
    if (!hero || document.querySelector(".home-destinations")) return;
    hero.insertAdjacentHTML("afterend", `<section class="section-head home-destinations-head"><span class="eyebrow">Start Here</span><h2>Choose a lane</h2><p>Three editorial worlds, one TFR filter: useful first, cleanly explained, and worth your time.</p></section><section class="quick-links home-destinations">${categories.map(card).join("")}</section>`);
    const latestHead = [...document.querySelectorAll(".section-head")].find((section) => section.querySelector("h2")?.textContent.trim() === "Latest 9 by date");
    if (latestHead) {
      latestHead.querySelector(".eyebrow").textContent = "Featured Articles";
      latestHead.querySelector("h2").textContent = "Start with these reads";
      latestHead.querySelector("p").textContent = "A curated first pass through the current Technology, Entertainment, and Productivity stories.";
    }
  }

  function addCategoryTopicCards() {
    const category = categories.find((item) => path.endsWith(item.href));
    const strip = document.querySelector(".subtopic-strip");
    document.querySelector(".category-hero")?.classList.add("pcb-panel");
    if (!category || !strip) return;
    strip.outerHTML = `<section class="topic-card-grid ${category.className}" aria-label="${category.title} subcategories">${category.topics.map(([title, href, image]) => `<a class="topic-card ${category.className}" href="${href}"><img src="${image}" alt="${title}"><span>${category.title}</span><h2>${title}</h2></a>`).join("")}</section>`;
  }

  function card(item) {
    return `<a class="category-card destination-card ${item.className}" href="${item.href}" aria-label="${item.title}"><img src="${item.image}" alt=""><div><p>${item.copy}</p></div></a>`;
  }

  function initCarouselAccent() {
    const carousel = document.querySelector(".latest-carousel");
    if (!carousel) return;

    const colors = {
      technology: "var(--cyan)",
      entertainment: "var(--lime)",
      productivity: "var(--white)"
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const carouselBox = carousel.getBoundingClientRect();
      const center = carouselBox.left + carouselBox.width / 2;
      const cards = [...carousel.querySelectorAll(".carousel-card")];
      const active = cards.reduce((closest, card) => {
        const box = card.getBoundingClientRect();
        const distance = Math.abs(box.left + box.width / 2 - center);
        return !closest || distance < closest.distance ? { card, distance } : closest;
      }, null)?.card;

      const category = ["technology", "entertainment", "productivity"].find((name) => active?.classList.contains(name));
      carousel.style.setProperty("--carousel-accent", colors[category] || colors.technology);
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    carousel.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  }
}());
