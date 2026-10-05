import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Site-wide motion system. Single entry point loaded once per page.
 * Entrance and reveal choreography stays on opacity/transform, and every
 * scroll-triggered animation is registered inside a matchMedia("(prefers-reduced-motion: no-preference)")
 * context so it never runs — and never touches inline styles — when the
 * visitor has reduced motion enabled.
 */

const DURATION = {
  FAST: 0.2,
  NORMAL: 0.45,
  REVEAL: 0.65,
  WIPE: 0.52,
} as const;

const EASE = {
  OUT: "power3.out",
  IN_OUT: "power2.inOut",
  CSS_OUT: "cubic-bezier(.22,1,.36,1)",
} as const;

const STAGGER = 0.085;
const HERO_HOLD_SECONDS = 2.8;

type PreparedMotion = {
  play: () => void;
  kill: () => void;
};

function applyMotionTokens() {
  const root = document.documentElement;
  root.style.setProperty("--motion-fast", `${DURATION.FAST}s`);
  root.style.setProperty("--motion-normal", `${DURATION.NORMAL}s`);
  root.style.setProperty("--motion-reveal", `${DURATION.REVEAL}s`);
  root.style.setProperty("--motion-ease-out", EASE.CSS_OUT);
}

function initReveals() {
  // Single elements: header eyebrows, headings, standalone blocks.
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  items.forEach((el) => {
    gsap.from(el, {
      y: 32,
      opacity: 0,
      duration: DURATION.REVEAL,
      ease: EASE.OUT,
      scrollTrigger: {
        trigger: el,
        start: "top 75%",
        once: true,
      },
    });
  });

  // Groups: grids/lists whose children stagger in together.
  const groups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]");
  groups.forEach((group) => {
    const children = group.querySelectorAll<HTMLElement>(":scope > [data-reveal-item]");
    if (!children.length) return;
    gsap.from(children, {
      y: 28,
      opacity: 0,
      duration: DURATION.REVEAL,
      ease: EASE.OUT,
      stagger: STAGGER,
      scrollTrigger: {
        trigger: group,
        start: "top 75%",
        once: true,
      },
    });
  });
}

function prepareHero(): PreparedMotion | undefined {
  const root = document.querySelector<HTMLElement>("[data-hero-lines]");
  if (!root) return;

  const lines = gsap.utils.toArray<HTMLElement>(".hero-line", root);
  const dots = document.querySelectorAll<HTMLElement>("[data-hero-dots] .hero-dot");
  if (!lines.length) return;

  const eyebrow = document.querySelector<HTMLElement>("[data-hero-eyebrow]");
  const copy = document.querySelector<HTMLElement>("[data-hero-copy]");
  const actions = gsap.utils.toArray<HTMLElement>("[data-hero-action]");
  const media = document.querySelector<HTMLElement>("[data-hero-media]");
  const hold = Number(root.dataset.holdMs) || HERO_HOLD_SECONDS * 1000;
  const holdSeconds = hold / 1000;

  gsap.set(lines, { opacity: 0, y: 26 });
  gsap.set(lines[0], { opacity: 1, y: 0 });
  if (dots[0]) gsap.set(dots[0], { backgroundColor: "#b9ff4d" });

  if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 16 });
  gsap.set(root, { opacity: 0, y: 30 });
  if (copy) gsap.set(copy, { opacity: 0, y: 20 });
  if (actions.length) gsap.set(actions, { opacity: 0, y: 14 });
  if (media) gsap.set(media, { opacity: 0, y: 16, scale: 0.985 });

  const tl = gsap.timeline({ paused: true });
  if (eyebrow) {
    tl.to(eyebrow, { opacity: 1, y: 0, duration: DURATION.NORMAL, ease: EASE.OUT }, 0);
  }
  tl.to(root, { opacity: 1, y: 0, duration: DURATION.REVEAL, ease: EASE.OUT }, 0.08);
  if (copy) {
    tl.to(copy, { opacity: 1, y: 0, duration: DURATION.NORMAL, ease: EASE.OUT }, 0.22);
  }
  if (actions.length) {
    tl.to(
      actions,
      { opacity: 1, y: 0, duration: DURATION.NORMAL, ease: EASE.OUT, stagger: STAGGER },
      0.34
    );
  }
  if (media) {
    tl.to(media, { opacity: 1, y: 0, scale: 1, duration: DURATION.REVEAL, ease: EASE.OUT }, 0.2);
  }

  let stepAt = Math.max(1, tl.duration()) + holdSeconds;

  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1];
    const curr = lines[i];
    tl.to(prev, { opacity: 0, y: -26, duration: DURATION.REVEAL, ease: EASE.IN_OUT }, stepAt)
      .to(curr, { opacity: 1, y: 0, duration: DURATION.REVEAL, ease: EASE.IN_OUT }, stepAt);
    if (dots.length) {
      tl.to(
        dots,
        {
          backgroundColor: (dotIndex) => (dotIndex === i ? "#b9ff4d" : "#3a3a36"),
          duration: DURATION.FAST,
        },
        stepAt
      );
    }
    stepAt += DURATION.REVEAL;
    if (i < lines.length - 1) stepAt += holdSeconds;
  }

  return { play: () => tl.play(0), kill: () => tl.kill() };
}

function preparePageIntro(): PreparedMotion | undefined {
  const root = document.querySelector<HTMLElement>("[data-page-intro]");
  if (!root) return;

  const items = gsap.utils.toArray<HTMLElement>("[data-intro-item]", root);
  if (!items.length) return;

  items.forEach((item) => {
    const isMedia = item.dataset.introItem === "media";
    const isHeadline = item.dataset.introItem === "headline";
    gsap.set(item, {
      opacity: 0,
      y: isHeadline ? 30 : isMedia ? 16 : 18,
      scale: isMedia ? 0.985 : 1,
    });
  });

  const tl = gsap.timeline({ paused: true });
  items.forEach((item, index) => {
    const isMedia = item.dataset.introItem === "media";
    const isHeadline = item.dataset.introItem === "headline";
    tl.to(
      item,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: isHeadline || isMedia ? DURATION.REVEAL : DURATION.NORMAL,
        ease: EASE.OUT,
      },
      index * 0.1
    );
  });

  return { play: () => tl.play(0), kill: () => tl.kill() };
}

function initLabCardReveals() {
  const groups = gsap.utils.toArray<HTMLElement>("[data-lab-card-group]");
  groups.forEach((group) => {
    const cards = Array.from(group.querySelectorAll<HTMLElement>("[data-lab-card]"));
    if (!cards.length) return;
    gsap.from(cards, {
      opacity: 0,
      y: 36,
      scale: 0.985,
      duration: DURATION.REVEAL,
      ease: EASE.OUT,
      stagger: STAGGER,
      clearProps: "opacity,transform",
      scrollTrigger: {
        trigger: group,
        start: "top 76%",
        once: true,
      },
    });
  });
}

function initLabFilters() {
  const filterBar = document.querySelector<HTMLElement>("[data-lab-filters]");
  if (!filterBar) return;

  const buttons = Array.from(filterBar.querySelectorAll<HTMLButtonElement>("[data-filter]"));
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-lab-card]"));
  let busy = false;

  const updateButtons = (active: HTMLButtonElement) => {
    buttons.forEach((button) => {
      const on = button === active;
      button.dataset.active = on ? "true" : "false";
      button.classList.toggle("border-paper", on);
      button.classList.toggle("bg-paper", on);
      button.classList.toggle("text-ink", on);
      button.classList.toggle("border-[#2b2b28]", !on);
      button.classList.toggle("bg-transparent", !on);
      button.classList.toggle("text-[#9c9a94]", !on);
    });
  };

  const showCategory = (category: string) => {
    cards.forEach((card) => {
      card.style.display = category === "All" || card.dataset.cat === category ? "" : "none";
    });
  };

  const handlers = buttons.map((button) => {
    const handler = () => {
      if (busy) return;
      const category = button.dataset.filter ?? "All";
      updateButtons(button);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        showCategory(category);
        return;
      }

      busy = true;
      const visibleCards = cards.filter((card) => getComputedStyle(card).display !== "none");
      gsap.to(visibleCards, {
        opacity: 0,
        y: -6,
        scale: 0.985,
        duration: DURATION.FAST,
        ease: EASE.IN_OUT,
        stagger: 0.02,
        overwrite: true,
        onComplete: () => {
          showCategory(category);
          const shownCards = cards.filter((card) => getComputedStyle(card).display !== "none");
          gsap.fromTo(
            shownCards,
            { opacity: 0, y: 14, scale: 0.985 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: DURATION.NORMAL,
              ease: EASE.OUT,
              stagger: 0.05,
              clearProps: "opacity,transform",
              overwrite: true,
              onComplete: () => {
                busy = false;
              },
            }
          );
        },
      });
    };
    button.addEventListener("click", handler);
    return () => button.removeEventListener("click", handler);
  });

  return () => handlers.forEach((remove) => remove());
}

function initDecorativeVideos() {
  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-decorative-video]"));
  if (!videos.length) return;

  const nearby = new Set<HTMLVideoElement>();
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const sync = (video: HTMLVideoElement) => {
    if (document.hidden || motionQuery.matches || !nearby.has(video)) {
      video.pause();
      return;
    }
    void video.play().catch(() => undefined);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) nearby.add(video);
        else nearby.delete(video);
        sync(video);
      });
    },
    { rootMargin: "300px 0px", threshold: 0.01 }
  );

  videos.forEach((video) => {
    video.pause();
    observer.observe(video);
  });

  const syncAll = () => videos.forEach(sync);
  document.addEventListener("visibilitychange", syncAll);
  motionQuery.addEventListener("change", syncAll);

  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", syncAll);
    motionQuery.removeEventListener("change", syncAll);
  };
}

function initNavIndicator() {
  const container = document.querySelector<HTMLElement>("[data-nav-links]");
  const indicator = container?.querySelector<HTMLElement>("[data-nav-indicator]");
  if (!container || !indicator) return;

  const links = Array.from(container.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"));

  const moveTo = (el: HTMLElement) => {
    const containerBox = container.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    indicator.style.setProperty("--nav-x", `${box.left - containerBox.left}px`);
    indicator.style.setProperty("--nav-w", `${box.width}`);
    indicator.style.setProperty("--nav-o", "1");
  };

  const hide = () => indicator.style.setProperty("--nav-o", "0");

  const activeLink = links.find((el) => el.dataset.navActive === "true");

  links.forEach((el) => {
    el.addEventListener("mouseenter", () => moveTo(el));
    el.addEventListener("focus", () => moveTo(el));
  });

  container.addEventListener("mouseleave", () => {
    if (activeLink) moveTo(activeLink);
    else hide();
  });
  container.addEventListener("focusout", (e) => {
    if (container.contains(e.relatedTarget as Node)) return;
    if (activeLink) moveTo(activeLink);
    else hide();
  });

  if (activeLink) {
    requestAnimationFrame(() => moveTo(activeLink));
  }

  window.addEventListener("resize", () => {
    const current = links.find((el) => el.matches(":hover")) ?? activeLink;
    if (current) moveTo(current);
  });
}

/**
 * Split-panel page-transition wipe (see the loader spec: 520ms, cubic-bezier(.72,0,.18,1),
 * left-to-right only). The site is a classic multi-page Astro build, so this doesn't swap
 * content client-side — it plays the outro wipe over the CURRENT page, then hands off to a
 * real navigation once the panel is fully dark. Because the incoming document's <html> is
 * already painted #0a0a0a (see the inline style in Layout.astro's <head>) before any other
 * CSS loads, that handoff reads as continuous darkness with zero visible seam — matching the
 * source spec's "removing the overlay is invisible" note, with no incoming-side code needed.
 */
function initPageTransition() {
  const overlayEl = document.getElementById("hh-page-transition");
  const panelEl = overlayEl?.querySelector<HTMLElement>("[data-tp-panel]");
  const letters = overlayEl ? Array.from(overlayEl.querySelectorAll<HTMLElement>("[data-tp-letter]")) : [];
  const counterEl = overlayEl?.querySelector<HTMLElement>("[data-tp-counter]");
  const percentEl = overlayEl?.querySelector<HTMLElement>("[data-tp-percent]");
  const tickEl = overlayEl?.querySelector<HTMLElement>("[data-tp-tick]");
  if (!overlayEl || !panelEl || !counterEl || !percentEl || !tickEl || !letters.length) return;

  const overlay = overlayEl;
  const panel = panelEl;
  const counter = counterEl;
  const percentNode = percentEl;
  const tickNode = tickEl;

  const BAND_START = 38;
  const BAND_END = 62;
  const STEPS = [0, 29, 57, 84, 100];

  // cubic-bezier(.72, 0, .18, 1), sampled by Newton iteration on x — same math as loader-spec.astro.
  function bez(t: number, p1: number, p2: number) {
    const u = 1 - t;
    return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
  }
  function wipeEase(x: number) {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const err = bez(t, 0.72, 0.18) - x;
      const d = 3 * (1 - t) * (1 - t) * 0.72 + 6 * (1 - t) * t * (0.18 - 0.72) + 3 * t * t * (1 - 0.18);
      if (Math.abs(d) < 1e-5) break;
      t -= err / d;
    }
    return bez(Math.min(1, Math.max(0, t)), 0, 1);
  }

  function render(p: number) {
    const pct = p * 100;
    panel.style.width = pct + "%";
    letters.forEach((el, i) => {
      const center = BAND_START + ((i + 0.5) * (BAND_END - BAND_START)) / letters.length;
      el.style.color = pct > center ? "#eeece6" : "#0a0a0a";
    });
    let snapped = 0;
    for (const s of STEPS) if (pct >= s) snapped = s;
    percentNode.textContent = snapped + "%";
    counter.style.opacity = String(Math.min(1, p * 12));
    tickNode.style.width = `max(0px, min(calc(100% - 5em), calc(${((pct - 5) / 0.9).toFixed(2)}% - 5em)))`;
  }

  function playThenGo(href: string) {
    overlay.style.display = "block";
    render(0);
    const state = { p: 0 };
    gsap.to(state, {
      p: 1,
      duration: DURATION.WIPE,
      ease: wipeEase,
      onUpdate: () => render(state.p),
      onComplete: () => window.location.assign(href),
    });
  }

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const link = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;
    if (link.origin !== window.location.origin) return;
    if (link.pathname === window.location.pathname) return; // in-page anchors (#work, #top, etc.)

    e.preventDefault();
    playThenGo(link.href);
  });
}

function initPicsLightbox() {
  const grid = document.querySelector<HTMLElement>("[data-pics-grid]");
  const lightbox = document.getElementById("pics-lightbox");
  const imgEl = document.getElementById("pics-lightbox-img") as HTMLImageElement | null;
  const counterEl = document.getElementById("pics-lightbox-counter");
  if (!grid || !lightbox || !imgEl || !counterEl) return;

  const items = Array.from(grid.querySelectorAll<HTMLButtonElement>("[data-pics-item]"));
  if (!items.length) return;

  const closeBtn = lightbox.querySelector<HTMLElement>("[data-lb-close]");
  const prevBtn = lightbox.querySelector<HTMLElement>("[data-lb-prev]");
  const nextBtn = lightbox.querySelector<HTMLElement>("[data-lb-next]");

  let index = 0;

  function show(i: number) {
    index = (i + items.length) % items.length;
    const src = items[index].dataset.src ?? "";
    const alt = items[index].dataset.alt ?? "";
    counterEl!.textContent = `${index + 1} / ${items.length}`;
    imgEl!.style.opacity = "0";
    const preload = new Image();
    preload.onload = () => {
      imgEl!.src = src;
      imgEl!.alt = alt;
      imgEl!.style.opacity = "1";
    };
    preload.src = src;
  }

  function open(i: number) {
    show(i);
    lightbox!.classList.add("is-open");
    lightbox!.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  }

  function close() {
    lightbox!.classList.remove("is-open");
    lightbox!.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }

  items.forEach((el, i) => el.addEventListener("click", () => open(i)));
  closeBtn?.addEventListener("click", close);
  prevBtn?.addEventListener("click", () => show(index - 1));
  nextBtn?.addEventListener("click", () => show(index + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox!.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
}

function initHeaderScroll() {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header) return;
  ScrollTrigger.create({
    start: "top -1",
    onUpdate: (self) => {
      header.classList.toggle("is-scrolled", self.scroll() > 4);
    },
  });
}

function initScrollTop() {
  const btn = document.querySelector<HTMLButtonElement>("[data-scroll-top]");
  if (!btn) return;
  ScrollTrigger.create({
    start: "top -1",
    onUpdate: (self) => {
      btn.classList.toggle("is-visible", self.scroll() > 600);
    },
  });
  btn.addEventListener("click", () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });
}

export function initMotion() {
  applyMotionTokens();
  const mm = gsap.matchMedia();
  const labFilterCleanup = initLabFilters();
  const videoCleanup = initDecorativeVideos();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const pageIntro = preparePageIntro();
    const hero = prepareHero();
    document.documentElement.classList.remove("motion-pending");

    initReveals();
    initLabCardReveals();
    pageIntro?.play();
    hero?.play();

    return () => {
      pageIntro?.kill();
      hero?.kill();
    };
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    // Static, fully-visible fallback: no timed cycling, no transform offsets.
    document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-item]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    const root = document.querySelector<HTMLElement>("[data-hero-lines]");
    if (root) root.dataset.step = "0";
    document.documentElement.classList.remove("motion-pending");
  });

  // Independent of motion preference: a lightweight, non-animated class
  // toggle for header density on scroll (no transform/opacity tween).
  initHeaderScroll();

  // Scroll-to-top button visibility — same plain class-toggle approach.
  initScrollTop();

  // Nav underline indicator: pure CSS transform transition, instant under
  // reduced motion via the stylesheet rule above — runs unconditionally.
  initNavIndicator();

  // Page-transition wipe: checks prefers-reduced-motion itself at click time
  // (a plain, un-intercepted navigation is the correct reduced-motion fallback).
  initPageTransition();

  // Pics gallery lightbox: no-ops on pages without [data-pics-grid].
  initPicsLightbox();

  window.addEventListener(
    "pagehide",
    () => {
      labFilterCleanup?.();
      videoCleanup?.();
      mm.revert();
    },
    { once: true }
  );
}
