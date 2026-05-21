const CHROME_STORE_URL = "#";

const STEPS = [
  {
    tag: "Step 01",
    title: "Install CineCoop",
    heading: "1. Install CineCoop",
    body: "Click Install CineCoop to open the Chrome Web Store, then Add to Chrome. Pin the extension.",
  },
  {
    tag: "Step 02",
    title: "Open a video",
    heading: "2. Open a video",
    body: "Go to Netflix, YouTube, Disney+, or another platform. Start the movie or episode.",
  },
  {
    tag: "Step 03",
    title: "Create a session",
    heading: "3. Create a session",
    body: "Open CineCoop, pick the service, and start a session. You are the host.",
  },
  {
    tag: "Step 04",
    title: "Invite friends",
    heading: "4. Invite friends",
    body: "Copy the invite link. Friends can join without a Discord account.",
  },
  {
    tag: "Step 05",
    title: "Enjoy together",
    heading: "5. Enjoy together",
    body: "Synced play, pause, and seek. Chat, GIFs, and voice with Discord.",
  },
];

function setInstallLinks(url) {
  document.querySelectorAll("#store-link, #hero-install, #nav-install, .steps-band .btn-primary, .how-left .btn-primary").forEach((el) => {
    if (el) el.href = url;
  });
}

function initReveal() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  els.forEach((el) => io.observe(el));
}

function initHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initSteps() {
  const screen = document.getElementById("step-screen");
  const detail = document.getElementById("step-detail");
  const buttons = document.querySelectorAll(".step-btn");
  if (!screen || !detail) return;

  function showStep(i) {
    const s = STEPS[i];
    if (!s) return;

    screen.classList.add("is-changing");
    detail.classList.add("is-changing");

    setTimeout(() => {
      screen.querySelector(".step-tag").textContent = s.tag;
      screen.querySelector("h3").textContent = s.title;
      detail.querySelector("h4").textContent = s.heading;
      detail.querySelector("p").textContent = s.body;
      buttons.forEach((b, j) => b.classList.toggle("active", j === i));
      screen.classList.remove("is-changing");
      detail.classList.remove("is-changing");
    }, 180);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => showStep(Number(btn.dataset.step)));
  });
}

function initShowsVideo() {
  const video = document.querySelector(".shows-video");
  if (!video) return;

  const play = () => {
    video.muted = true;
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  play();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) play();
        else video.pause();
      });
    },
    { threshold: 0.25 }
  );
  io.observe(video);
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });
}

document.getElementById("year").textContent = String(new Date().getFullYear());
setInstallLinks(CHROME_STORE_URL);
initReveal();
initHeader();
initSteps();
initShowsVideo();
initNav();
