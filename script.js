const CHROME_STORE_URL = "#"; // Collez votre lien Chrome Web Store ici

const STEPS = [
  {
    tag: "Étape 01",
    title: "Installer CineCoop",
    heading: "1. Installer CineCoop",
    body: "Cliquez sur Installer CineCoop pour ouvrir le Chrome Web Store, puis Ajouter à Chrome. Épinglez l'extension dans la barre d'outils.",
  },
  {
    tag: "Étape 02",
    title: "Ouvrir une vidéo",
    heading: "2. Ouvrir une vidéo",
    body: "Allez sur Netflix, YouTube, Disney+ ou une autre plateforme compatible. Lancez le film ou l'épisode que vous voulez regarder ensemble.",
  },
  {
    tag: "Étape 03",
    title: "Créer une session",
    heading: "3. Créer une session",
    body: "Ouvrez CineCoop, choisissez le service, puis démarrez une session. Vous devenez l'hôte de la watch party.",
  },
  {
    tag: "Étape 04",
    title: "Inviter des amis",
    heading: "4. Inviter des amis",
    body: "Copiez le lien d'invitation et envoyez-le à vos amis. Ils rejoignent sans compte Discord — uniquement pour le chat si besoin.",
  },
  {
    tag: "Étape 05",
    title: "Profiter ensemble",
    heading: "5. Profiter ensemble",
    body: "Play, pause et avance sont synchronisés pour tout le monde. Chat, GIF et vocal disponibles avec Discord.",
  },
];

function setInstallLinks(url) {
  const links = document.querySelectorAll(
    "#store-link, #hero-install, #nav-install, .how-left .btn-primary"
  );
  links.forEach((el) => {
    if (el) el.href = url;
  });
}

function initSteps() {
  const screen = document.getElementById("step-screen");
  const detail = document.getElementById("step-detail");
  const buttons = document.querySelectorAll(".step-btn");

  function showStep(i) {
    const s = STEPS[i];
    if (!s) return;
    screen.querySelector(".step-tag").textContent = s.tag;
    screen.querySelector("h3").textContent = s.title;
    detail.querySelector("h4").textContent = s.heading;
    detail.querySelector("p").textContent = s.body;
    buttons.forEach((b, j) => b.classList.toggle("active", j === i));
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => showStep(Number(btn.dataset.step)));
  });
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

document.getElementById("year").textContent = String(new Date().getFullYear());
setInstallLinks(CHROME_STORE_URL);
initSteps();
initNav();
