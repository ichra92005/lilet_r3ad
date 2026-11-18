/**
 * src/screens/landing.js
 * Landing screen – converted from the React landing folder.
 * Uses the new blue/indigo theme with glassmorphic cards and
 * connects "Get Started" / "Guest" to the app's existing router.
 */
import { navigate } from "../app/router.js";

/* ── tiny helpers ──────────────────────────────────────────────── */
const h = (tag, cls, attrs = {}) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") el.textContent = v;
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  return el;
};

const SLOGANS = [
  "Your ideas, your space, your progress.",
  "Make studying simple and fun.",
  "One place for everything you learn.",
  "Small steps, big progress.",
];
let sloganIdx = 0;

/* ── SVG icons (inline, no dependency) ─────────────────────────── */
const arrowRightSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
const cursorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0f172a" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="landing-cursor-icon"><path d="M2 2l16 7-5 2-3 5z"/></svg>`;

/* ── actions ───────────────────────────────────────────────────── */
function goGetStarted() {
  navigate("/login");
}
function goGuest() {
  navigate("/login");
}
/* ── build ─────────────────────────────────────────────────────── */
export function renderLanding(container) {
  container.className = "screen landing-new";

  /* ── Blurred background image ── */
  const bgDiv = h("div", "landing-bg");
  bgDiv.setAttribute("aria-hidden", "true");
  const bgImg = h("img", "landing-bg-img");
  bgImg.src = "/assets/___3__26dcc747.jpeg";
  bgImg.alt = "";
  bgImg.onerror = () => { bgImg.style.display = "none"; };
  const bgOverlay = h("div", "landing-bg-overlay");
  bgDiv.append(bgImg, bgOverlay);
  container.appendChild(bgDiv);

  /* ══════════════ NAVBAR ══════════════ */
  const nav = h("header", "landing-nav");
  const navInner = h("div", "landing-nav-inner");

  // Brand
  const brand = h("a", "landing-brand");
  brand.href = "#/";
  const brandImg = h("img", "landing-brand-img");
  brandImg.src = "/assets/aistudio/side.png";
  brandImg.alt = "";
  const brandText = h("span", "", { text: "Lilet Raad" });
  brand.append(brandImg, brandText);

  // Nav links
  const navLinks = h("nav", "landing-nav-links");
  navLinks.setAttribute("aria-label", "Primary navigation");
  for (const { label, action } of [
    { label: "Features", action: () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) },
    { label: "Sign in", action: goGuest },
  ]) {
    const btn = h("button", "landing-nav-link", { text: label, type: "button" });
    btn.addEventListener("click", action);
    navLinks.appendChild(btn);
  }

  // Nav CTA
  const navCta = h("button", "landing-btn-primary landing-btn-sm", { text: "Get Started", type: "button" });
  navCta.addEventListener("click", goGetStarted);

  navInner.append(brand, navLinks, navCta);
  nav.appendChild(navInner);
  container.appendChild(nav);

  /* ══════════════ MAIN ══════════════ */
  const main = h("main", "landing-main");

  /* ── Hero Section ── */
  const heroSection = h("section", "landing-hero-section");
  const heroCard = h("div", "landing-hero-card");
  const heroGrid = h("div", "landing-hero-grid");

  // Left column
  const heroLeft = h("div", "landing-hero-left");

  // Brand badge
  const heroBadge = h("div", "landing-hero-badge");
  const heroBadgeImg = h("img", "landing-hero-badge-img");
  heroBadgeImg.src = "/assets/aistudio/side.png";
  heroBadgeImg.alt = "";
  const heroBadgeText = h("p", "landing-hero-badge-text", { text: "Lilet Raad" });
  heroBadge.append(heroBadgeImg, heroBadgeText);

  const heroSubBadge = h("p", "landing-hero-sub-badge", { text: "YOUR LEARNING SPACE" });

  // Title with "Create" selection box
  const heroTitle = h("h1", "landing-hero-title");
  heroTitle.innerHTML = `Learn, <span class="landing-create-box">Create<span class="landing-corner landing-corner-tl"></span><span class="landing-corner landing-corner-tr"></span><span class="landing-corner landing-corner-bl"></span><span class="landing-corner landing-corner-br"></span>${cursorSvg}</span> &amp; Grow!`;

  const heroDesc = h("p", "landing-hero-desc", { text: "Your little space to organise your ideas, study smarter and make learning easier." });

  // CTA buttons
  const ctaRow = h("div", "landing-cta-row");
  const ctaBtns = h("div", "landing-cta-buttons");

  const getStartedBtn = h("button", "landing-btn-primary", { type: "button" });
  getStartedBtn.innerHTML = `<span>Get Started</span>${arrowRightSvg}`;
  getStartedBtn.addEventListener("click", goGetStarted);

  ctaBtns.appendChild(getStartedBtn);

  ctaRow.appendChild(ctaBtns);
  heroLeft.append(heroBadge, heroSubBadge, heroTitle, heroDesc, ctaRow);

  // Right column – mascot
  const heroRight = h("div", "landing-hero-right");
  const mascot = h("img", "landing-mascot");
  mascot.src = "/assets/aistudio/side.png";
  mascot.alt = "Lilet Raad smiling star mascot";
  heroRight.appendChild(mascot);

  heroGrid.append(heroLeft, heroRight);
  heroCard.appendChild(heroGrid);
  heroSection.appendChild(heroCard);
  main.appendChild(heroSection);

  /* ── Slogan Strip ── */
  const strip = h("section", "landing-strip");
  strip.setAttribute("aria-label", "Study workspace highlights");
  const stripInner = h("div", "landing-strip-inner");

  const stripBrand = h("span", "landing-strip-brand", { text: "Lilet Raad · Learning Space" });

  const sloganBtn = h("button", "landing-slogan-btn", { type: "button" });
  sloganBtn.textContent = `"${SLOGANS[sloganIdx]}"`;
  sloganBtn.title = "Click to cycle study slogans";
  sloganBtn.addEventListener("click", () => {
    sloganIdx = (sloganIdx + 1) % SLOGANS.length;
    sloganBtn.textContent = `"${SLOGANS[sloganIdx]}"`;
  });

  const stripActions = h("div", "landing-strip-actions");
  // LinkedIn
  const linkedIn = h("a", "landing-strip-link");
  linkedIn.href = "https://www.linkedin.com/in/ichrak-nour-elhouda-belkahla-478a5b2b2/";
  linkedIn.target = "_blank";
  linkedIn.rel = "noopener noreferrer";
  linkedIn.innerHTML = `<span>LinkedIn</span>`;
  // Email
  const emailLink = h("a", "landing-strip-link");
  emailLink.href = "mailto:ichraknour22@gmail.com?subject=Feedback";
  emailLink.innerHTML = `<span>Email</span>`;
  // Contact
  const contactBtn = h("button", "landing-btn-primary landing-btn-xs", { text: "Contact Us", type: "button" });
stripActions.append(linkedIn, emailLink, contactBtn);

  contactBtn.addEventListener("click", () => { window.location.href = "mailto:ichraknour22@gmail.com?subject=Feedback"; });
  stripInner.append(stripBrand, sloganBtn, stripActions);
  strip.appendChild(stripInner);
  main.appendChild(strip);

  /* ── Features Bento ── */
  const featSection = h("section", "landing-features-section");
  featSection.id = "features";

  const featHeader = h("div", "landing-feat-header");
  const featTitle = h("h2", "landing-feat-title", { text: "Everything you need in one place" });
  const featDesc = h("p", "landing-feat-desc", { text: "Organise your ideas, build flashcards to remember more, and test yourself in one calm learning space." });
  featHeader.append(featTitle, featDesc);

  const featGrid = h("div", "landing-feat-grid");

  const FEATURES = [
    { title: "Create and organise your documents.", desc: "Keep lecture notes, reading summaries, and fresh ideas sorted in neat topic folders without clutter.", cls: "landing-feat-blue" },
    { title: "Make flashcards to remember more.", desc: "Turn key concepts into clean double-sided cards for calm, active recall sessions every day.", cls: "landing-feat-indigo", tilted: true },
    { title: "Create quizzes and test yourself.", desc: "Check what stuck before study milestones with bite-sized self-quizzes and instant feedback.", cls: "landing-feat-amber", bolt: true },
  ];

  FEATURES.forEach((f, i) => {
    const article = h("article", "landing-feat-article");

    if (f.tilted) {
      const backing = h("div", "landing-feat-backing");
      backing.setAttribute("aria-hidden", "true");
      article.appendChild(backing);
    }

    if (f.bolt) {
      const bolt = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      bolt.setAttribute("viewBox", "0 0 64 64");
      bolt.setAttribute("aria-hidden", "true");
      bolt.classList.add("landing-feat-bolt");
      bolt.innerHTML = `<defs><linearGradient id="softPastelThunder" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FDE68A"/><stop offset="55%" stop-color="#FDBA74"/><stop offset="100%" stop-color="#F9A8D4"/></linearGradient></defs><path d="M36 6 L15 35 C14 36.5 15 38.5 17 38.5 H29 L24 56 C23.5 58 26 59 27.5 57.5 L49 28.5 C50 27 49 25 47 25 H35 L40 7.5 C40.5 5.5 37.5 4.5 36 6 Z" fill="url(#softPastelThunder)" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>`;
      article.appendChild(bolt);
    }

    const card = h("button", `landing-feat-card ${f.cls} ${f.tilted ? "landing-feat-tilted" : ""}`, { type: "button" });
    card.addEventListener("click", goGuest);
    const cTitle = h("h3", "landing-feat-card-title", { text: f.title });
    const cDesc = h("p", "landing-feat-card-desc", { text: f.desc });
    card.append(cTitle, h("div", "").appendChild(cDesc).parentNode);
    article.appendChild(card);
    featGrid.appendChild(article);
  });

  featSection.append(featHeader, featGrid);
  main.appendChild(featSection);

  /* ── Final CTA ── */
  const finalSection = h("section", "landing-final-section");
  const finalCard = h("div", "landing-final-card");
  const finalLeft = h("div", "landing-final-left");
  finalLeft.innerHTML = `
    <p class="landing-final-label">Small steps, big progress</p>
    <h2 class="landing-final-title">Ready to build your calm study space?</h2>
    <p class="landing-final-desc">Organise your documents, flip through flashcards, test yourself with quizzes, and watch your progress grow.</p>
  `;
  const finalRight = h("div", "landing-final-right");
  const finalGetStarted = h("button", "landing-final-btn-white", { text: "Get Started", type: "button" });
  finalGetStarted.addEventListener("click", goGetStarted);
  const finalGuest = h("button", "landing-final-btn-outline", { text: "Already have an account? Sign in", type: "button" });
  finalGuest.addEventListener("click", goGuest);
  finalRight.append(finalGetStarted, finalGuest);
  finalCard.append(finalLeft, finalRight);
  finalSection.appendChild(finalCard);
  main.appendChild(finalSection);

  container.appendChild(main);

  /* ══════════════ FOOTER ══════════════ */
  const footer = h("footer", "landing-footer");
  const footerInner = h("div", "landing-footer-inner");

  const footerBrand = h("div", "landing-footer-brand");
  const footerBrandImg = h("img", "landing-footer-brand-img");
  footerBrandImg.src = "/assets/aistudio/p2logo3_ba527f4c.png";
  footerBrandImg.alt = "";
  footerBrand.innerHTML = "";
  footerBrand.append(
    footerBrandImg,
    h("span", "landing-footer-name", { text: "Lilet Raad" }),
    h("span", "", { text: "·", "aria-hidden": "true" }),
    h("span", "landing-footer-sub", { text: "Your Learning Space" })
  );

  const footerCredit = h("p", "landing-footer-credit", { text: "Made with ♡ by Ichrak Nour Elhouda Belkhla" });

  const footerLinks = h("div", "landing-footer-links");
  const fGuest = h("button", "landing-footer-link", { text: "Sign in", type: "button" });
  fGuest.addEventListener("click", goGuest);
  footerLinks.appendChild(fGuest);

  footerInner.append(footerBrand, footerCredit, footerLinks);
  footer.appendChild(footerInner);
  container.appendChild(footer);
}
