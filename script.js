const CHROME_STORE_URL = "#";

const STEPS = [
  {
    tag: "Step 01",
    title: "Install CineCoop",
    heading: "1. Install CineCoop",
    body: "Click Install CineCoop to open the Chrome Web Store, then click Add to Chrome. Pin the extension.",
    url: "chromewebstore.google.com/detail/cinecoop",
  },
  {
    tag: "Step 02",
    title: "Open a video",
    heading: "2. Open a video",
    body: "Go to Netflix, YouTube, Disney+, or another platform. Start the movie or episode.",
    url: "www.netflix.com/watch/…",
  },
  {
    tag: "Step 03",
    title: "Create a session",
    heading: "3. Create a session",
    body: "Click the CineCoop icon in Chrome, then Start session on the streaming tab.",
    url: "www.netflix.com/watch/…",
  },
  {
    tag: "Step 04",
    title: "Invite friends",
    heading: "4. Invite friends",
    body: "Copy the invite link from the CineCoop panel and send it to your friends.",
    url: "www.netflix.com/watch/…",
  },
  {
    tag: "Step 05",
    title: "Enjoy together",
    heading: "5. Enjoy together",
    body: "Synced play, pause, and seek. Chat, GIFs, and voice with Discord.",
    url: "www.netflix.com/watch/…",
  },
];

const HOW_POV_URLS = STEPS.map((s) => s.url);

/** POV scene duration (aligned with CSS animations, ms) */
const HOW_POV_STEP_MS = [4000, 4000, 4000, 4000, 9000];

const HOW_POV_CHAT_USERS = {
  you: { name: "You", color: "#5865f2", initial: "M", id: "you" },
  nora: { name: "Nora", color: "#57a55a", initial: "N", id: "nora" },
  nina: { name: "Nina", color: "#e91e63", initial: "N", id: "nina" },
};

const HOW_POV_CHAT_SCRIPT = [
  { user: "nina", text: "can we skip the intro?", pause: 1400 },
  { user: "nora", text: "host has control — fair", pause: 1300 },
  { user: "nina", text: "ok no spoilers pls", pause: 1200 },
  { user: "nora", text: "we're synced now ✓", pause: 1100 },
  { user: "nina", text: "this scene is insane", pause: 1400 },
  { user: "nora", text: "GIF incoming", gif: true, pause: 1600 },
];

let howPovChatStart = null;
let howPovChatStop = null;

function initHowPovChatDemo() {
  const log = document.getElementById("how-pov-chat-log");
  const membersEl = document.getElementById("how-pov-chat-members");
  const typingEl = document.getElementById("how-pov-chat-typing");
  const typingName = typingEl?.querySelector("strong");
  const typingAvatar = typingEl?.querySelector(".how-pov-typing-avatar");
  if (!log || !membersEl) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timers = [];
  let running = false;
  let scriptIdx = 0;

  function scrollLog() {
    log.scrollTop = log.scrollHeight;
  }

  function renderMembers() {
    membersEl.innerHTML = [HOW_POV_CHAT_USERS.you, HOW_POV_CHAT_USERS.nora, HOW_POV_CHAT_USERS.nina]
      .map(
        (u) =>
          `<div class="member-item"><span class="member-avatar" style="background:${heroEsc(u.color)}">${heroEsc(u.initial)}</span><span>${heroEsc(u.name)}</span></div>`
      )
      .join("");
  }

  function setTyping(user) {
    if (!typingEl || !typingName || !typingAvatar) return;
    if (!user) {
      typingEl.classList.add("hidden");
      return;
    }
    typingName.textContent = user.name;
    typingAvatar.style.background = user.color;
    typingEl.classList.remove("hidden");
    scrollLog();
  }

  function appendHowPovMessage(user, text, { gif = false } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "chat-item" + (gif ? " chat-item--gif" : "");
    const safeName = heroEsc(user.name);
    const safeText = heroEsc(text);
    const avatar = heroEsc(heroAvatarUrl(user));
    wrap.innerHTML = `
      <img src="${avatar}" alt="${safeName}" />
      <div class="chat-body">
        <div class="chat-name">${safeName}</div>
        ${text ? `<div class="chat-text">${safeText}</div>` : ""}
        ${gif ? `<div class="chat-gif chat-gif--solo chat-gif--placeholder" role="img" aria-label="GIF"></div>` : ""}
      </div>
    `;
    log.appendChild(wrap);
    while (log.children.length > 8) {
      log.firstElementChild?.remove();
    }
    scrollLog();
  }

  function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
  }

  function runScriptStep() {
    if (!running) return;
    if (scriptIdx >= HOW_POV_CHAT_SCRIPT.length) {
      timers.push(
        window.setTimeout(() => {
          log.innerHTML = "";
          scriptIdx = 0;
          runScriptStep();
        }, 900)
      );
      return;
    }

    const item = HOW_POV_CHAT_SCRIPT[scriptIdx];
    const user = HOW_POV_CHAT_USERS[item.user];
    if (!user) {
      scriptIdx += 1;
      runScriptStep();
      return;
    }

    if (reduce) {
      appendHowPovMessage(user, item.text, { gif: item.gif });
      scriptIdx += 1;
      timers.push(window.setTimeout(runScriptStep, item.pause || 1000));
      return;
    }

    setTyping(user);
    timers.push(
      window.setTimeout(() => {
        setTyping(null);
        appendHowPovMessage(user, item.text, { gif: item.gif });
        scriptIdx += 1;
        timers.push(window.setTimeout(runScriptStep, item.pause || 1000));
      }, 650)
    );
  }

  howPovChatStop = () => {
    running = false;
    clearTimers();
    setTyping(null);
    log.innerHTML = "";
    scriptIdx = 0;
  };

  howPovChatStart = () => {
    howPovChatStop();
    running = true;
    renderMembers();
    scriptIdx = 0;
    runScriptStep();
  };

  renderMembers();
}

function setInstallLinks(url) {
  document.querySelectorAll("#install, #nav-install, .how-left .btn-primary").forEach((el) => {
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

function applyHowPovHotspots(pov, step) {
  const scene = pov.querySelector(`.how-pov-scene[data-scene="${step}"]`);
  if (!scene) return;
  const set = (name, key) => {
    const v = scene.dataset[key];
    if (v != null && v !== "") pov.style.setProperty(name, `${v}%`);
  };
  set("--pov-click-x", "clickX");
  set("--pov-click-y", "clickY");
  set("--pov-from-x", "fromX");
  set("--pov-from-y", "fromY");
}

function setHowPovStep(i) {
  const pov = document.getElementById("how-pov");
  if (!pov) return;
  const step = ((i % STEPS.length) + STEPS.length) % STEPS.length;
  pov.dataset.step = String(step);
  pov.querySelectorAll(".how-pov-scene").forEach((el) => {
    el.classList.toggle("is-active", Number(el.dataset.scene) === step);
  });
  applyHowPovHotspots(pov, step);
  const urlEl = document.getElementById("how-pov-url");
  if (urlEl && HOW_POV_URLS[step]) urlEl.textContent = HOW_POV_URLS[step];
  pov.classList.remove("how-pov-restart");
  void pov.offsetWidth;
  pov.classList.add("how-pov-restart");
  if (step === 4) howPovChatStart?.();
  else howPovChatStop?.();
}

function initSteps() {
  const screen = document.getElementById("step-screen");
  const detail = document.getElementById("step-detail");
  const buttons = document.querySelectorAll(".step-btn");
  if (!screen || !detail) return;

  let activeStep = 0;
  let autoTimer = null;

  function showStep(i) {
    const s = STEPS[i];
    if (!s) return;
    activeStep = i;

    buttons.forEach((b, j) => b.classList.toggle("active", j === i));
    setHowPovStep(i);

    screen.classList.add("is-changing");
    detail.classList.add("is-changing");

    setTimeout(() => {
      screen.querySelector(".step-tag").textContent = s.tag;
      screen.querySelector("h3").textContent = s.title;
      detail.querySelector("h4").textContent = s.heading;
      detail.querySelector("p").textContent = s.body;
      screen.classList.remove("is-changing");
      detail.classList.remove("is-changing");
    }, 180);

    scheduleAuto();
  }

  function scheduleAuto() {
    if (autoTimer) window.clearTimeout(autoTimer);
    const delay = HOW_POV_STEP_MS[activeStep] ?? 4000;
    autoTimer = window.setTimeout(() => {
      showStep((activeStep + 1) % STEPS.length);
    }, delay);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showStep(Number(btn.dataset.step));
    });
  });

  showStep(0);
  scheduleAuto();

  const howSection = document.getElementById("how");
  if (howSection && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) scheduleAuto();
          else if (autoTimer) {
            window.clearTimeout(autoTimer);
            autoTimer = null;
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(howSection);
  }
}

const HERO_DEMO_USERS = [
  { name: "Raymond", color: "#5865f2", initial: "R" },
  { name: "Nora", color: "#57a55a", initial: "N" },
  { name: "Nina", color: "#e91e63", initial: "N" },
  { name: "Priya", color: "#f0b232", initial: "P" },
  { name: "Theo", color: "#9b59b6", initial: "T" },
  { name: "Luna", color: "#1abc9c", initial: "L" },
];

/** 2 friends + You = 3 session members; only they speak in the demo */
const HERO_DEMO_SPEAKERS = [HERO_DEMO_USERS[1], HERO_DEMO_USERS[2]];

const HERO_DEMO_LINES = [
  "stream looks razor sharp tonight",
  "sync feels locked on my end",
  "that cut was brutal — loved it",
  "who hit pause? not guilty",
  "ten second rewind then go",
  "subtitles saved that line for me",
  "audio mix is actually perfect",
  "zero spoilers in this chat pls",
  "snack run — nobody skip ahead",
  "this cast is ridiculously good",
  "goosebumps during that wide shot",
  "host veto on skips is fair",
  "wifi stable on my side finally",
  "countdown from 3 to play?",
  "that cliffhanger though…",
  "adding this to the weekend list",
  "picture-in-picture gang rise up",
  "volume up for the score",
  "ok that joke landed",
  "we need a part two immediately",
];

/** Scripted opening — no duplicate lines; GIFs tied to franchises */
const HERO_DEMO_SEED = [
  { speaker: 0, text: "Prime stream looks crisp tonight" },
  { speaker: 1, text: "sync is locked for me too" },
  { speaker: 1, gifQuery: "stranger things eleven" },
  { speaker: 0, text: "that wide shot gave me chills" },
  { speaker: 1, text: "Homelander would complain about the pause" },
  { speaker: 0, gifQuery: "the boys homelander" },
  { speaker: 1, text: "need like 10 sec rewind max" },
  { speaker: 0, gifQuery: "star wars lightsaber duel" },
  { speaker: 1, text: "very winter-is-coming vibes 🐺" },
  { speaker: 0, gifQuery: "game of thrones dragon" },
  { speaker: 1, text: "ok press play on 3?" },
];

const HERO_DEMO_YOU = { name: "You", color: "#5865f2", initial: "M", id: "you" };
const TENOR_KEY = "LIVDSRZULELA";
const HERO_CHAT_STORE_KEY = "cinecoop-hero-chat-v7";
const HERO_CHAT_MAX_STORED = 15;
const HERO_CHAT_MAX_VISIBLE = 15;
const GIF_FAV_KEY = "cinecoop-gif-favorites-v1";

const HERO_GIF_FEATURED_QUERY = "movie tv series popcorn cinema watching";
const HERO_GIF_MOVIE_SUFFIX = " movie tv series cinema";

const HERO_GIF_CATEGORY_TILES = [
  { kind: "favorites", label: "Favorites", emoji: "⭐", bg: "linear-gradient(145deg,#1a4a8c 0%,#0c1528 100%)" },
  { kind: "featured", label: "Movies & shows", emoji: "🎬", bg: "linear-gradient(145deg,#5c3d7a 0%,#1a0f24 100%)" },
  { kind: "search", label: "Stranger Things", q: "stranger things eleven", emoji: "🔦" },
  { kind: "search", label: "The Boys", q: "the boys homelander", emoji: "🦸" },
  { kind: "search", label: "Star Wars", q: "star wars lightsaber", emoji: "⚔️" },
  { kind: "search", label: "Game of Thrones", q: "game of thrones dragon", emoji: "🐉" },
  { kind: "search", label: "Popcorn", q: "popcorn movie cinema bucket", emoji: "🍿" },
  { kind: "search", label: "Movie night", q: "movie night couch popcorn friends", emoji: "🛋️" },
];

const HERO_BOT_GIF_TERMS = [
  "the boys homelander",
  "the boys starlight powers",
  "stranger things eleven powers",
  "stranger things upside down",
  "star wars lightsaber duel",
  "star wars the force",
  "game of thrones dragon",
  "game of thrones winter is coming",
  "the boys butcher reaction",
  "stranger things running",
];

const HERO_GIF_REJECT_RE =
  /\b(crypto|cryptocurrency|bitcoin|btc|ethereum|eth|nft|blockchain|forex|trading|trader|stock\s*market|stocks|finance|financial|millionaire|invest|investment|defi|token|wallet|banking|profit|cash\s*money|money\s*rain|dfx|forex|bull\s*market|bear\s*market)\b/i;

const HERO_GIF_MOVIE_RE =
  /\b(movie|movies|film|films|cinema|cinematic|theater|theatre|theatrical|popcorn|clapper|clapperboard|reel|netflix|hulu|disney|marvel|dc\s*comics|series|tv\s*show|television|tele|episode|streaming|blockbuster|hollywood|premiere|trailer|binge|watch(?:ing)?|sitcom|drama|horror|comedy|sci-?fi|fantasy|anime|cartoon|superhero|oscar|emmy|red\s*carpet|sofa|couch|drive-?in|screen|projector|subtitles|season\s*\d|film\s*noir|the\s+boys|stranger\s+things|star\s+wars|game\s+of\s+thrones|homelander|lightsaber|westeros|eleven|mandalorian|dragon)\b/i;

function heroEsc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function heroAvatarUrl(user) {
  const bg = String(user.color || "#5865f2").replace("#", "");
  const label = encodeURIComponent(String(user.initial || user.name || "M").slice(0, 1));
  return `https://ui-avatars.com/api/?name=${label}&background=${bg}&color=fff&size=64&bold=true`;
}

function heroUserProfile(user) {
  return {
    id: user.id || user.name,
    username: user.name,
    avatarUrl: heroAvatarUrl(user),
  };
}

function pickHeroSpeaker(exclude) {
  const pool = exclude ? HERO_DEMO_SPEAKERS.filter((u) => u.name !== exclude) : HERO_DEMO_SPEAKERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffleHeroLines() {
  return [...HERO_DEMO_LINES].sort(() => Math.random() - 0.5);
}

function syncHeroDemoHeights() {
  const video = document.querySelector(".hero-demo-video");
  const stage = document.querySelector(".hero-demo-stage");
  const player = document.querySelector(".hero-demo-player");
  if (!video || !stage) return;
  const h = Math.round(video.getBoundingClientRect().height);
  if (h > 0) {
    const px = `${h}px`;
    stage.style.setProperty("--hero-demo-video-h", px);
    player?.style.setProperty("--hero-demo-video-h", px);
  }
}

function initHeroDemoVideo() {
  const video = document.querySelector(".hero-demo-video");
  if (!video || video.dataset.heroVideoInit === "1") return;
  video.dataset.heroVideoInit = "1";

  video.loop = true;
  video.muted = true;
  video.setAttribute("loop", "");

  const onLayout = () => syncHeroDemoHeights();
  video.addEventListener("loadedmetadata", onLayout);
  video.addEventListener("loadeddata", onLayout);
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(onLayout);
    ro.observe(video);
  }
  window.addEventListener("resize", onLayout, { passive: true });
  window.addEventListener("load", onLayout, { passive: true });
  onLayout();

  const play = () => {
    video.muted = true;
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  const restartIfAtEnd = () => {
    const d = video.duration;
    if (!d || !Number.isFinite(d)) return;
    if (video.currentTime >= d - 0.08) {
      video.currentTime = 0;
      play();
    }
  };

  video.addEventListener("ended", () => {
    video.currentTime = 0;
    play();
  });
  video.addEventListener("timeupdate", restartIfAtEnd);
  video.addEventListener("stalled", play);
  video.addEventListener("canplay", play);

  play();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) play();
  });
}

function initHeroChatDemo() {
  const log = document.getElementById("hero-demo-chat-log");
  const input = document.getElementById("hero-demo-input");
  const gifToggle = document.getElementById("hero-demo-gif-toggle");
  const gifPicker = document.getElementById("hero-demo-gif-picker");
  const gifSearch = document.getElementById("hero-demo-gif-search");
  const gifCategories = document.getElementById("hero-demo-gif-categories");
  const gifResults = document.getElementById("hero-demo-gif-results");
  const gifHint = document.getElementById("hero-demo-gif-hint");
  const replyPreview = document.getElementById("hero-demo-reply-preview");
  const replyText = document.getElementById("hero-demo-reply-text");
  const replyCancel = document.getElementById("hero-demo-reply-cancel");
  const membersEl = document.getElementById("hero-demo-members");
  if (!log || !input) return;
  if (log.dataset.heroChatInit === "1") return;
  log.dataset.heroChatInit = "1";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chatMessagesById = new Map();
  let replyTarget = null;
  let localMsgSeq = 0;
  let botTimer = null;
  let gifDebounce = null;
  let gifFavorites = [];
  try {
    gifFavorites = JSON.parse(localStorage.getItem(GIF_FAV_KEY) || "[]");
    if (!Array.isArray(gifFavorites)) gifFavorites = [];
  } catch {
    gifFavorites = [];
  }

  function saveGifFavorites() {
    try {
      localStorage.setItem(GIF_FAV_KEY, JSON.stringify(gifFavorites.slice(0, 48)));
    } catch (_) {}
  }

  function saveChatHistory() {
    try {
      const arr = [...chatMessagesById.values()]
        .sort((a, b) => (a.ts || 0) - (b.ts || 0))
        .slice(-HERO_CHAT_MAX_STORED);
      sessionStorage.setItem(HERO_CHAT_STORE_KEY, JSON.stringify(arr));
    } catch (_) {}
  }

  function trimVisibleChat() {
    if (chatMessagesById.size <= HERO_CHAT_MAX_VISIBLE) return;
    const sorted = [...chatMessagesById.entries()].sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0));
    while (sorted.length > HERO_CHAT_MAX_VISIBLE) {
      const [id] = sorted.shift();
      chatMessagesById.delete(id);
      log.querySelector(`.chat-item[data-msg-id="${CSS.escape(id)}"]`)?.remove();
    }
  }

  function loadChatHistory() {
    try {
      const raw = sessionStorage.getItem(HERO_CHAT_STORE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function scrollLog() {
    log.scrollTop = log.scrollHeight;
  }

  function renderMessageReactions(msgId) {
    const entry = chatMessagesById.get(msgId);
    if (!entry) return;
    const node = log.querySelector(`.chat-item[data-msg-id="${msgId}"] .chat-meta`);
    if (!node) return;
    const reactions = entry.reactions || {};
    const parts = Object.entries(reactions)
      .filter(([, count]) => count > 0)
      .map(([emoji, count]) => `<span class="chat-reaction-badge">${heroEsc(emoji)} ${count}</span>`);
    node.innerHTML = parts.join("");
  }

  function appendChatMessage(record) {
    const msgId =
      record.id ||
      `${record.profile?.id || "u"}-${record.ts || Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const stored = {
      id: msgId,
      text: record.text || "",
      gif: record.gif || "",
      profile: record.profile || heroUserProfile(HERO_DEMO_YOU),
      ts: record.ts || Date.now(),
      replyTo: record.replyTo || null,
      reactions: record.reactions || {},
      system: !!record.system,
    };
    chatMessagesById.set(msgId, stored);
    log.querySelector(`.chat-item[data-msg-id="${CSS.escape(msgId)}"]`)?.remove();

    const wrap = document.createElement("div");
    wrap.className = "chat-item";
    if (stored.system) wrap.classList.add("chat-item--system");
    wrap.dataset.msgId = msgId;

    const safeName = heroEsc(stored.profile.username || "Guest");
    const safeAvatar = heroEsc(stored.profile.avatarUrl || heroAvatarUrl(HERO_DEMO_YOU));
    const safeText = heroEsc(stored.text);
    const gif = String(stored.gif || "").trim();
    const hasText = Boolean((stored.text || "").trim());
    const hasGif = Boolean(gif);
    if (hasGif && !hasText) wrap.classList.add("chat-item--gif");

    let replyHtml = "";
    if (stored.replyTo && chatMessagesById.has(stored.replyTo)) {
      const parent = chatMessagesById.get(stored.replyTo);
      const parentText = heroEsc((parent.text || "").slice(0, 48) || (parent.gif ? "[GIF]" : ""));
      replyHtml = `<div class="chat-reply">↪ ${heroEsc(parent.profile?.username || "User")}: ${parentText}</div>`;
    }

    wrap.innerHTML = `
      <img src="${safeAvatar}" alt="${safeName}" />
      <div class="chat-body">
        <div class="chat-name">${safeName}</div>
        ${replyHtml}
        ${hasText ? `<div class="chat-text">${stored.system ? `<strong>${safeName}</strong> ${safeText}` : safeText}</div>` : ""}
        ${hasGif ? `<img class="chat-gif${hasText ? "" : " chat-gif--solo"}" src="${heroEsc(gif)}" alt="gif" loading="lazy" />` : ""}
        <div class="chat-meta"></div>
      </div>
      <div class="chat-actions-inline">
        <button type="button" class="chat-action-btn" data-react="👍">👍</button>
        <button type="button" class="chat-action-btn" data-react="😂">😂</button>
        <button type="button" class="chat-action-btn" data-react="❤️">❤️</button>
        <button type="button" class="chat-action-btn reply" data-reply="1">↩</button>
      </div>
    `;

    log.appendChild(wrap);
    trimVisibleChat();
    renderMessageReactions(msgId);
    scrollLog();
    saveChatHistory();
  }

  function setReplyTarget(msgId) {
    const target = chatMessagesById.get(msgId);
    if (!target) return;
    replyTarget = msgId;
    const preview = ((target.text || "").trim() || "[GIF]").slice(0, 60);
    if (replyText) replyText.textContent = `Reply to ${target.profile?.username || "user"}: ${preview}`;
    replyPreview?.classList.remove("hidden");
    input.focus();
  }

  function clearReply() {
    replyTarget = null;
    replyPreview?.classList.add("hidden");
  }

  function sendUserMessage(text, gifUrl) {
    const t = (text || "").trim();
    const g = (gifUrl || "").trim();
    if (!t && !g) return;
    localMsgSeq += 1;
    appendChatMessage({
      id: `you-${Date.now()}-${localMsgSeq}`,
      text: t,
      gif: g,
      profile: heroUserProfile(HERO_DEMO_YOU),
      ts: Date.now(),
      replyTo: replyTarget,
    });
    input.value = "";
    clearReply();
    closeGifPicker();
    input.focus();
  }

  function sendUserGif(url) {
    sendUserMessage("", url);
  }

  function addReaction(msgId, emoji) {
    const entry = chatMessagesById.get(msgId);
    if (!entry) return;
    entry.reactions = entry.reactions || {};
    entry.reactions[emoji] = (entry.reactions[emoji] || 0) + 1;
    renderMessageReactions(msgId);
    saveChatHistory();
  }

  function renderMembers() {
    if (!membersEl) return;
    const all = [HERO_DEMO_YOU, ...HERO_DEMO_SPEAKERS];
    membersEl.innerHTML = all
      .map(
        (u) =>
          `<div class="member-item"><span class="member-avatar" style="background:${heroEsc(u.color)}">${heroEsc(u.initial)}</span><span>${heroEsc(u.name)}</span></div>`
      )
      .join("");
  }

  async function fetchTenor(path, params = {}) {
    const url = new URL(`https://g.tenor.com/v1${path}`);
    url.searchParams.set("key", TENOR_KEY);
    url.searchParams.set("media_filter", "tinygif,gif");
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") url.searchParams.set(k, String(v));
    }
    const target = url.toString();
    try {
      const res = await fetch(target);
      if (res.ok) return res.json();
    } catch (_) {}
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
    const proxied = await fetch(proxyUrl);
    if (!proxied.ok) throw new Error("tenor");
    return proxied.json();
  }

  function getTenorMediaUrls(item) {
    if (item?.media_formats) {
      const tiny = item.media_formats.tinygif;
      const gif = item.media_formats.gif;
      const preview = tiny?.url || gif?.url;
      const full = gif?.url || tiny?.url;
      return preview && full ? { preview, full } : null;
    }
    const block = Array.isArray(item?.media) ? item.media[0] : null;
    if (!block) return null;
    const preview = block.tinygif?.url || block.gif?.url;
    const full = block.gif?.url || block.tinygif?.url;
    return preview && full ? { preview, full } : null;
  }

  function isFavoriteGif(url) {
    return gifFavorites.some((x) => x.url === url);
  }

  function heroGifMetaText(item) {
    return [item?.content_description, item?.title, ...(item?.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function heroGifIsRejected(item) {
    return HERO_GIF_REJECT_RE.test(heroGifMetaText(item));
  }

  function heroGifIsMovieRelated(item) {
    return HERO_GIF_MOVIE_RE.test(heroGifMetaText(item));
  }

  function heroQueryLooksMovie(q) {
    const term = (q || "").trim().toLowerCase();
    if (!term) return false;
    if (HERO_GIF_MOVIE_RE.test(term)) return true;
    return /\b(film|movie|cinema|popcorn|netflix|marvel|disney|horror|comedy|anime|episode|series|show)\b/i.test(term);
  }

  function heroGifSearchQuery(q) {
    const term = (q || "").trim();
    if (!term) return term;
    if (heroQueryLooksMovie(term)) return term;
    return `${term}${HERO_GIF_MOVIE_SUFFIX}`;
  }

  function filterTenorForCinema(items, { allowPeople = true } = {}) {
    const list = Array.isArray(items) ? items : [];
    return list.filter((item) => {
      if (!item || heroGifIsRejected(item)) return false;
      if (!heroGifIsMovieRelated(item)) return false;
      if (!allowPeople && heroGifShowsPerson(item)) return false;
      return Boolean(getTenorMediaUrls(item)?.full);
    });
  }

  function showGifResultsArea() {
    if (gifCategories) gifCategories.style.display = "none";
    gifResults?.classList.add("visible");
  }

  function showGifCategoriesArea() {
    if (gifCategories) gifCategories.style.display = "grid";
    gifResults?.classList.remove("visible");
    if (gifResults) gifResults.innerHTML = "";
  }

  function syncGifBrowseUi() {
    const q = (gifSearch?.value || "").trim();
    if (q) showGifResultsArea();
    else showGifCategoriesArea();
  }

  function renderGifResults(items) {
    if (!gifResults) return;
    showGifResultsArea();
    gifResults.innerHTML = "";
    if (!items.length) {
      if (gifHint) gifHint.textContent = "No movie-related GIFs for this search.";
      return;
    }
    if (gifHint) gifHint.textContent = "Click a GIF to send it in chat.";
    items.forEach((item) => {
      const urls = getTenorMediaUrls(item);
      if (!urls) return;
      const btn = document.createElement("div");
      btn.className = "gif-result";
      const fav = isFavoriteGif(urls.full);
      btn.innerHTML = `
        <img src="${heroEsc(urls.preview)}" alt="gif result" loading="lazy" />
        <button type="button" class="gif-fav-btn ${fav ? "active" : ""}" title="${fav ? "Remove favorite" : "Add favorite"}">${fav ? "★" : "☆"}</button>
      `;
      btn.addEventListener("click", () => sendUserGif(urls.full));
      btn.querySelector(".gif-fav-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFavoriteGif(urls.full)) {
          gifFavorites = gifFavorites.filter((x) => x.url !== urls.full);
        } else {
          gifFavorites.unshift({ url: urls.full, preview: urls.preview });
        }
        saveGifFavorites();
        renderGifResults(items);
      });
      gifResults.appendChild(btn);
    });
  }

  function renderFavoriteGifResults() {
    if (!gifResults) return;
    showGifResultsArea();
    gifResults.innerHTML = "";
    if (!gifFavorites.length) {
      if (gifHint) gifHint.textContent = "No favorite GIFs yet — star a result to save it.";
      return;
    }
    if (gifHint) gifHint.textContent = "Click a GIF to send it in chat.";
    gifFavorites.forEach((fav) => {
      const btn = document.createElement("div");
      btn.className = "gif-result";
      btn.innerHTML = `
        <img src="${heroEsc(fav.preview || fav.url)}" alt="favorite gif" loading="lazy" />
        <button type="button" class="gif-fav-btn active" title="Remove favorite">★</button>
      `;
      btn.addEventListener("click", () => sendUserGif(fav.url));
      btn.querySelector(".gif-fav-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        gifFavorites = gifFavorites.filter((x) => x.url !== fav.url);
        saveGifFavorites();
        renderFavoriteGifResults();
      });
      gifResults.appendChild(btn);
    });
  }

  async function fetchTenorFeaturedGifs() {
    if (gifHint) gifHint.textContent = "Loading movie GIFs…";
    if (gifResults) gifResults.innerHTML = "";
    try {
      const json = await fetchTenor("/search", {
        q: HERO_GIF_FEATURED_QUERY,
        limit: 40,
        contentfilter: "high",
      });
      const filtered = filterTenorForCinema(json?.results);
      renderGifResults(filtered);
      if (!filtered.length && gifHint) {
        gifHint.textContent = "No GIFs found — try another category.";
      }
    } catch {
      if (gifHint) gifHint.textContent = "Unavailable — try again or search for a movie or show.";
      renderGifResults([]);
    }
  }

  async function tenorSearchByKeyword(q) {
    const term = heroGifSearchQuery((q || "").trim());
    if (!term) return;
    if (gifHint) gifHint.textContent = "Searching Tenor…";
    if (gifResults) gifResults.innerHTML = "";
    try {
      const json = await fetchTenor("/search", { q: term, limit: 40, contentfilter: "high" });
      const filtered = filterTenorForCinema(json?.results);
      renderGifResults(filtered);
      if (!filtered.length && gifHint) {
        gifHint.textContent = "No movie GIFs for this search — try “popcorn”, “tv series”, “marvel”…";
      }
    } catch {
      if (gifHint) gifHint.textContent = "Search failed — check your connection.";
      renderGifResults([]);
    }
  }

  function renderGifCategoryTiles() {
    if (!gifCategories) return;
    gifCategories.innerHTML = "";
    HERO_GIF_CATEGORY_TILES.forEach((tile, index) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "gif-category-tile";
      b.dataset.tileId = String(index);
      const fall = document.createElement("div");
      fall.className = "gif-category-fallback";
      fall.style.background = tile.bg || "linear-gradient(145deg,#2d3138 0%,#1a1c20 100%)";
      const bg = document.createElement("div");
      bg.className = "gif-category-bg";
      const emoji = document.createElement("span");
      emoji.className = "gif-category-emoji";
      emoji.textContent = tile.emoji || "🎬";
      const span = document.createElement("span");
      span.className = "gif-category-label";
      span.textContent = tile.label;
      b.append(fall, bg, emoji, span);
      b.addEventListener("click", async () => {
        if (tile.kind === "favorites") {
          if (gifSearch) gifSearch.value = "";
          renderFavoriteGifResults();
        } else if (tile.kind === "featured") {
          if (gifSearch) gifSearch.value = "";
          await fetchTenorFeaturedGifs();
        } else if (tile.kind === "search" && tile.q) {
          if (gifSearch) gifSearch.value = tile.q;
          await tenorSearchByKeyword(tile.q);
        }
      });
      gifCategories.appendChild(b);
    });
    void loadGifCategoryPreviews();
  }

  async function loadGifCategoryPreviews() {
    if (!gifCategories) return;
    await Promise.all(
      HERO_GIF_CATEGORY_TILES.map(async (tile, index) => {
        try {
          let preview = "";
          if (tile.kind === "search" && tile.q) {
            const json = await fetchTenor("/search", { q: tile.q, limit: 8, contentfilter: "high" });
            preview = getTenorMediaUrls(filterTenorForCinema(json?.results)[0])?.preview || "";
          } else if (tile.kind === "featured") {
            const json = await fetchTenor("/search", {
              q: HERO_GIF_FEATURED_QUERY,
              limit: 8,
              contentfilter: "high",
            });
            const pick = filterTenorForCinema(json?.results)[0];
            preview = getTenorMediaUrls(pick)?.preview || "";
          } else if (tile.kind === "favorites" && gifFavorites.length) {
            preview = gifFavorites[0].preview || gifFavorites[0].url || "";
          }
          if (!preview) return;
          const btn = gifCategories.querySelector(`[data-tile-id="${index}"]`);
          const bg = btn?.querySelector(".gif-category-bg");
          if (!bg) return;
          bg.style.backgroundImage = `url("${preview}")`;
          btn.classList.add("has-preview");
        } catch (_) {}
      })
    );
  }

  function closeGifPicker() {
    gifPicker?.classList.add("hidden");
    gifToggle?.classList.remove("is-open");
  }

  function openGifPicker() {
    gifPicker?.classList.remove("hidden");
    gifToggle?.classList.add("is-open");
    if (gifSearch) gifSearch.value = "";
    renderGifCategoryTiles();
    syncGifBrowseUi();
    setTimeout(() => gifSearch?.focus(), 50);
  }

  log.addEventListener("click", (e) => {
    const btn = e.target.closest(".chat-action-btn");
    if (!btn) return;
    const row = e.target.closest(".chat-item");
    const msgId = row?.dataset?.msgId;
    if (!msgId) return;
    if (btn.hasAttribute("data-reply")) {
      setReplyTarget(msgId);
      return;
    }
    const emoji = btn.getAttribute("data-react");
    if (emoji) addReaction(msgId, emoji);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage(input.value);
    }
    if (e.key === "Escape") {
      if (!gifPicker?.classList.contains("hidden")) closeGifPicker();
      else clearReply();
    }
  });

  gifToggle?.addEventListener("click", () => {
    if (gifPicker?.classList.contains("hidden")) openGifPicker();
    else closeGifPicker();
  });

  gifSearch?.addEventListener("input", () => {
    clearTimeout(gifDebounce);
    const q = (gifSearch.value || "").trim();
    syncGifBrowseUi();
    gifDebounce = window.setTimeout(() => {
      if (!q) {
        renderGifCategoryTiles();
        syncGifBrowseUi();
        return;
      }
      void tenorSearchByKeyword(q);
    }, 320);
  });

  replyCancel?.addEventListener("click", clearReply);

  document.addEventListener("click", (e) => {
    if (!gifPicker || gifPicker.classList.contains("hidden")) return;
    if (e.target.closest(".hero-demo-chat")) return;
    closeGifPicker();
  });

  renderMembers();

  async function fetchFranchiseGif(query) {
    const q = heroGifSearchQuery(query);
    try {
      const json = await fetchTenor("/search", {
        q,
        limit: 28,
        contentfilter: "high",
      });
      const pool = filterTenorForCinema(json?.results, { allowPeople: true });
      if (!pool.length) return null;
      const item = pool[Math.floor(Math.random() * pool.length)];
      return getTenorMediaUrls(item)?.full || null;
    } catch (_) {
      return null;
    }
  }

  async function seedHeroConversation() {
    const baseTs = Date.now() - HERO_DEMO_SEED.length * 2800;
    for (let i = 0; i < HERO_DEMO_SEED.length; i++) {
      const item = HERO_DEMO_SEED[i];
      const speaker = HERO_DEMO_SPEAKERS[item.speaker] || HERO_DEMO_SPEAKERS[0];
      let gif = "";
      if (item.gifQuery) {
        gif = (await fetchFranchiseGif(item.gifQuery)) || "";
      }
      appendChatMessage({
        id: `seed-${i}`,
        text: item.text || "",
        gif,
        profile: heroUserProfile(speaker),
        ts: baseTs + i * 2800,
      });
    }
    scrollLog();
  }

  const saved = loadChatHistory()
    .sort((a, b) => (a?.ts || 0) - (b?.ts || 0))
    .slice(-HERO_CHAT_MAX_STORED);
  const seenIds = new Set();
  const restored = [];
  for (const m of saved) {
    if (!m?.id || seenIds.has(m.id)) continue;
    seenIds.add(m.id);
    restored.push(m);
  }
  if (restored.length) {
    restored.forEach((m) => appendChatMessage(m));
  } else {
    void seedHeroConversation();
  }

  requestAnimationFrame(() => {
    syncHeroDemoHeights();
    requestAnimationFrame(syncHeroDemoHeights);
  });

  async function fetchBotGif() {
    const terms = [...HERO_BOT_GIF_TERMS].sort(() => Math.random() - 0.5);
    for (const term of terms.slice(0, 6)) {
      const gif = await fetchFranchiseGif(term);
      if (gif) return gif;
    }
    return null;
  }

  function heroGifShowsPerson(item) {
    const text = heroGifMetaText(item);
    return /\b(man|woman|person|people|boy|girl|guy|celebr|actor|actress|human|face|couple|kid|child|baby|selfie|portrait)\b/.test(
      text
    );
  }

  if (reduce) return;

  let lastUser = HERO_DEMO_SPEAKERS[0].name;
  let heroLinePool = shuffleHeroLines();
  const recentBotTexts = [];

  function pickHeroLine() {
    if (!heroLinePool.length) {
      heroLinePool = shuffleHeroLines().filter((line) => !recentBotTexts.includes(line));
    }
    let line = heroLinePool.pop();
    if (!line || recentBotTexts.includes(line)) {
      heroLinePool = shuffleHeroLines().filter((l) => !recentBotTexts.includes(l));
      line = heroLinePool.pop() || HERO_DEMO_LINES[Math.floor(Math.random() * HERO_DEMO_LINES.length)];
    }
    recentBotTexts.push(line);
    if (recentBotTexts.length > 12) recentBotTexts.shift();
    return line;
  }

  function scheduleBot() {
    botTimer = window.setTimeout(async () => {
      const user = pickHeroSpeaker(lastUser);
      const isGif = Math.random() < 0.38;
      if (isGif) {
        const gifUrl = await fetchBotGif();
        if (gifUrl) {
          appendChatMessage({
            text: "",
            gif: gifUrl,
            profile: heroUserProfile(user),
            ts: Date.now(),
          });
        } else {
          const msgId = `bot-${Date.now()}`;
          appendChatMessage({
            id: msgId,
            text: pickHeroLine(),
            profile: heroUserProfile(user),
            ts: Date.now(),
          });
        }
      } else {
        const msgId = `bot-${Date.now()}`;
        appendChatMessage({
          id: msgId,
          text: pickHeroLine(),
          profile: heroUserProfile(user),
          ts: Date.now(),
        });
        if (Math.random() < 0.2) {
          const emoji = ["😂", "❤️", "🔥"][Math.floor(Math.random() * 3)];
          addReaction(msgId, emoji);
        }
      }
      lastUser = user.name;
      scheduleBot();
    }, 2600 + Math.random() * 2400);
  }

  scheduleBot();
}

function initShowsVideo() {
  document.querySelectorAll(".shows-video").forEach((video) => {
    if (video.dataset.showsVideoInit === "1") return;
    video.dataset.showsVideoInit = "1";

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
  });
}

const PLATFORMS = [
  ["Netflix", "netflix"],
  ["Max", "max"],
  ["Disney+", "disney"],
  ["YouTube", "youtube"],
  ["Prime Video", "prime"],
  ["Hulu", "hulu"],
  ["Spotify", "spotify"],
  ["Apple TV", "appletv"],
  ["Paramount+", "paramount"],
  ["Canal+", "canalplus"],
  ["MUBI", "mubi"],
  ["Crunchyroll", "crunchyroll"],
  ["Peacock", "peacock"],
  ["ESPN+", "espnplus"],
  ["fuboTV", "fubo"],
  ["Sling", "sling"],
  ["Stan", "stan"],
  ["Crave", "crave"],
  ["Rakuten Viki", "viki"],
  ["Pluto TV", "pluto"],
  ["Tubi", "tubi"],
  ["Shudder", "shudder"],
  ["Sony LIV", "sonyliv"],
  ["ZEE5", "zee5"],
  ["JioHotstar", "jiohotstar"],
  ["Shahid", "shahid"],
  ["Viu", "viu"],
  ["U-NEXT", "unext"],
  ["Hulu JP", "hulujp"],
  ["FOX ONE", "foxone"],
  ["Willow", "willow"],
  ["FanCode", "fancode"],
];

function initPlatformsGrid() {
  const platStat = document.getElementById("stat-platforms-count");
  if (platStat) platStat.textContent = `${PLATFORMS.length}+`;

  const grid = document.getElementById("platforms-grid");
  if (!grid) return;

  const frag = document.createDocumentFragment();
  PLATFORMS.forEach(([name, slug]) => {
    const li = document.createElement("li");
    li.className =
      slug === "disney"
        ? "platforms-grid-item logo-disney"
        : slug === "prime"
          ? "platforms-grid-item logo-prime"
          : "platforms-grid-item";
    const img = document.createElement("img");
    img.src = `assets/logos/${slug}.svg`;
    img.alt = name;
    img.loading = "lazy";
    img.width = 120;
    img.height = 32;
    li.appendChild(img);
    frag.appendChild(li);
  });
  grid.appendChild(frag);
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-menu-open");
  };

  const openNav = () => {
    nav.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.body.classList.add("nav-menu-open");
    }
  };

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("open")) closeNav();
    else openNav();
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) closeNav();
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("open")) return;
    if (e.target.closest(".site-header")) return;
    closeNav();
  });

  window.addEventListener(
    "resize",
    () => {
      if (window.matchMedia("(min-width: 1024px)").matches) closeNav();
    },
    { passive: true }
  );
}

function initSupport() {
  const wrap = document.getElementById("support-faq");
  const cards = document.querySelectorAll(".support-card[data-support-target]");
  if (!wrap) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function scrollToSection(id) {
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function setActiveCard(id) {
    cards.forEach((card) => {
      const active = card.dataset.supportTarget === id;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function handleHash() {
    const id = window.location.hash.replace(/^#/, "");
    if (id && document.getElementById(id)) {
      scrollToSection(id);
      setActiveCard(id);
    }
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.supportTarget;
      if (!id) return;
      setActiveCard(id);
      history.replaceState(null, "", `#${id}`);
      scrollToSection(id);
    });
  });

  handleHash();
  window.addEventListener("hashchange", handleHash);

  wrap.querySelectorAll(".support-faq").forEach((faq) => {
    faq.addEventListener("toggle", () => {
      if (!faq.open) return;
      const list = faq.closest(".support-faq-list");
      if (!list) return;
      list.querySelectorAll(".support-faq[open]").forEach((other) => {
        if (other !== faq) other.open = false;
      });
    });
  });
}

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
setInstallLinks(CHROME_STORE_URL);
initReveal();
initHeader();
initHowPovChatDemo();
initSteps();
initHeroDemoVideo();
initHeroChatDemo();
initShowsVideo();
initPlatformsGrid();
initNav();
initSupport();
