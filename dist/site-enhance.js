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
