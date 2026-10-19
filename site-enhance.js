(function () {
  // Homepage-only scroll interaction: colors the latest-carousel's active
  // accent line based on which card is centered. This is genuine runtime
  // behavior (depends on live scroll position), not content — everything
  // else that used to live in this file (destination cards, topic-card-grid,
  // pcb-panel toggling) is now baked into the HTML at generation time.
  // See _build/gen.py.
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
}());

(function () {
  // Mobile nav toggle: every static page shares the same generated header
  // markup (no per-page hamburger button), so inject one at runtime. CSS in
  // style.css hides/collapses .primary-nav under 820px and only shows this
  // button at that width, so this is a no-op above 820px.
  const header = document.querySelector(".site-header");
  const nav = header ? header.querySelector(".primary-nav") : null;
  if (!header || !nav) return;

  if (!nav.id) nav.id = "primary-nav";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "nav-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", nav.id);
  toggle.setAttribute("aria-label", "Toggle navigation menu");
  toggle.innerHTML = "<span></span><span></span><span></span>";

  header.insertBefore(toggle, nav);

  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820 && header.classList.contains("nav-open")) {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}());
