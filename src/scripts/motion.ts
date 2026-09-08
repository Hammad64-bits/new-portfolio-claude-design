import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Site-wide motion system. Single entry point loaded once per page.
 * Everything here is opacity/transform only, and every scroll-triggered
 * animation is registered inside a matchMedia("(prefers-reduced-motion: no-preference)")
 * context so it never runs — and never touches inline styles — when the
 * visitor has reduced motion enabled.
 */

const EASE_OUT = "power3.out";
const EASE_INOUT = "power2.inOut";

function initReveals() {
  // Single elements: header eyebrows, headings, standalone blocks.
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  items.forEach((el) => {
    gsap.from(el, {
      y: 22,
      opacity: 0,
      duration: 0.7,
      ease: EASE_OUT,
      scrollTrigger: {
        trigger: el,
        start: "top 87%",
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
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: EASE_OUT,
      stagger: 0.08,
      scrollTrigger: {
        trigger: group,
        start: "top 85%",
        once: true,
      },
    });
  });
}

function initHero() {
  const root = document.querySelector<HTMLElement>("[data-hero-lines]");
  if (!root) return;

  const lines = gsap.utils.toArray<HTMLElement>(".hero-line", root);
  const dots = document.querySelectorAll<HTMLElement>("[data-hero-dots] .hero-dot");
  if (!lines.length) return;

  const hold = Number(root.dataset.holdMs) || 4000;
  const holdSeconds = hold / 1000;

  gsap.set(lines, { opacity: 0, y: 26 });
  gsap.set(lines[0], { opacity: 1, y: 0 });
  if (dots[0]) gsap.set(dots[0], { backgroundColor: "#b9ff4d" });

  const tl = gsap.timeline({ delay: holdSeconds });

  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1];
    const curr = lines[i];
    tl.to(prev, { opacity: 0, y: -26, duration: 0.7, ease: EASE_INOUT }, `step${i}`)
      .to(curr, { opacity: 1, y: 0, duration: 0.7, ease: EASE_INOUT }, `step${i}`);
    if (dots.length) {
      tl.to(
        dots,
        {
          backgroundColor: (dotIndex) => (dotIndex === i ? "#b9ff4d" : "#3a3a36"),
          duration: 0.3,
        },
        `step${i}`
      );
    }
    if (i < lines.length - 1) tl.to({}, { duration: holdSeconds });
  }

  return () => {
    tl.kill();
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

  const DURATION = 0.52;
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
      duration: DURATION,
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
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    initReveals();
    const heroCleanup = initHero();
    return () => {
      heroCleanup?.();
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
}
