import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initSmoothScroll, scrollToY } from "./smooth";

gsap.registerPlugin(ScrollTrigger);

/**
 * Site-wide motion system. Single entry point loaded once per page.
 * Everything here is opacity/transform only, and every scroll-triggered
 * animation is registered inside a matchMedia("(prefers-reduced-motion: no-preference)")
 * context so it never runs — and never touches inline styles — when the
 * visitor has reduced motion enabled.
 */

const EASE_OUT = "power3.out";

function initReveals() {
  // Single elements: header eyebrows, headings, standalone blocks.
  // Homepage scroll scenes (src/scripts/scenes) own every element inside them.
  const free = (el: HTMLElement) => !el.closest("[data-scene]");
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]").filter(free);
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
  const groups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]").filter(free);
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

/** Full-screen lime loading card used before same-site page navigation. */
function initPageTransition() {
  const overlay = document.getElementById("hh-page-transition");
  const content = overlay?.querySelector<HTMLElement>("[data-loader-content]");
  const frame = overlay ? Array.from(overlay.querySelectorAll<SVGPathElement>("[data-loader-frame]")) : [];
  const letters = content ? Array.from(content.querySelectorAll<HTMLElement>("[data-loader-letter]")) : [];
  const underlines = content ? Array.from(content.querySelectorAll<HTMLElement>("[data-loader-underline]")) : [];
  if (!overlay || !content || !frame.length || !letters.length || underlines.length < 2) return;

  let transitioning = false;

  function playThenGo(href: string) {
    if (transitioning) return;
    transitioning = true;
    overlay.style.display = "block";
    const frameLengths = frame.map((path) => path.getTotalLength());

    gsap.set(content, { autoAlpha: 0 });
    frame.forEach((path, index) => {
      gsap.set(path, {
        strokeDasharray: frameLengths[index],
        strokeDashoffset: frameLengths[index],
      });
    });
    gsap.set(letters, { autoAlpha: 0, y: 22, scale: 0.82, rotation: -8 });
    gsap.set(underlines, { scaleX: 0 });

    const tl = gsap.timeline({ onComplete: () => window.location.assign(href) });
    tl.fromTo(
      overlay,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.34, ease: "power3.inOut" },
    )
      .to(frame, { strokeDashoffset: 0, duration: 0.38, stagger: 0.12, ease: "power2.out" })
      .set(content, { autoAlpha: 1 })
      .to(letters, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.34,
        stagger: 0.055,
        ease: "elastic.out(1, 0.45)",
      })
      .to(underlines[0], { scaleX: 1, duration: 0.18, ease: "power2.out" })
      .to(underlines[1], { scaleX: 1, duration: 0.18, ease: "power2.out" });
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
  btn.addEventListener("click", () => scrollToY(0));
}

export function initMotion() {
  initSmoothScroll();

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    initReveals();
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    // Static, fully-visible fallback: no transform offsets.
    document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-item]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
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
