document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav-links");
  const toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  // Active nav link based on current path
  const currentPath = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && href.endsWith(currentPath)) {
      a.classList.add("active");
    }
  });

  // Carousel setup
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const indicators = Array.from(document.querySelectorAll(".carousel-indicators button"));
  const prevBtn = document.querySelector(".carousel-prev");
  const nextBtn = document.querySelector(".carousel-next");
  let index = 0;
  let timerId = null;

  function goTo(idx) {
    if (!track) return;
    index = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    indicators.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function start() {
    stop();
    timerId = setInterval(() => goTo(index + 1), 5000);
  }

  function stop() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => { goTo(index - 1); start(); });
    nextBtn.addEventListener("click", () => { goTo(index + 1); start(); });
  }

  if (indicators.length) {
    indicators.forEach((btn, i) => btn.addEventListener("click", () => { goTo(i); start(); }));
  }

  const carousel = document.querySelector(".carousel");
  if (carousel) {
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    start();
  }
});