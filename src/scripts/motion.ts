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

  // Nav underline indicator: pure CSS transform transition, instant under
  // reduced motion via the stylesheet rule above — runs unconditionally.
  initNavIndicator();
}
