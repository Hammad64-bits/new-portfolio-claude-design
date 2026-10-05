import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Homepage scroll-scene foundation.
 *
 * Every scene is a `[data-scene="<name>"]` section. Its layout for the cinematic
 * (pinned) version lives in global.css behind the SAME media query as CINEMATIC
 * below, plus `html.js` — so sticky stages and scene heights are pure CSS and
 * never jump when JS initialises. JS only drives transforms/opacity/clip-path.
 *
 * Three mutually exclusive modes, resolved per scene by gsap.matchMedia():
 *   cinematic — desktop: sticky stages, scrubbed timelines, scene overlaps
 *   compact   — small/short screens: normal flow, simple one-shot reveals
 *   reduced   — prefers-reduced-motion: nothing animates, content is static
 *
 * Anything created inside a scene's setup (tweens, ScrollTriggers, SplitText)
 * is recorded by the matchMedia context and reverted when the mode changes.
 */
export const CINEMATIC =
  "(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)";

const CONDITIONS = {
  cinematic: CINEMATIC,
  compact:
    "(prefers-reduced-motion: no-preference) and (max-width: 1023.98px), (prefers-reduced-motion: no-preference) and (max-height: 599.98px)",
  reduced: "(prefers-reduced-motion: reduce)",
};

export type SceneMode = { cinematic: boolean; compact: boolean; reduced: boolean };
type Cleanup = void | (() => void);
type SceneSetup = (root: HTMLElement, mode: SceneMode) => Cleanup;

export function defineScene(name: string, setup: SceneSetup) {
  return () => {
    const root = document.querySelector<HTMLElement>(`[data-scene="${name}"]`);
    if (!root) return null;
    const mm = gsap.matchMedia(root);
    mm.add(CONDITIONS, (ctx) => {
      const mode = ctx.conditions as SceneMode;
      if (mode.reduced) return;
      return setup(root, mode);
    });
    return mm;
  };
}

/** Scoped, typed query helpers for a scene root. */
export function finder(root: HTMLElement) {
  return {
    one: <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel),
    all: <T extends HTMLElement = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel)),
  };
}

/**
 * A scrubbed timeline driven by scroll progress through `trigger`.
 * Linear ease by default: inside a scrub, easing belongs to individual tweens.
 */
export function scrubTimeline(trigger: Element, vars: ScrollTrigger.Vars = {}) {
  return gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8,
      invalidateOnRefresh: true,
      ...vars,
    },
  });
}

/**
 * Timeline fromTo whose from-state is applied to EVERY target immediately.
 * A staggered fromTo only renders its first target up front, leaving the rest
 * visible in their final state until the playhead reaches them — so staggers
 * are expanded into one single-target fromTo each (each renders immediately,
 * and each element is recorded exactly once for a clean matchMedia revert).
 */
export function fromTo(
  tl: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  position = 0
) {
  const { stagger, ...vars } = to;
  const each = typeof stagger === "number" ? stagger : 0;
  gsap.utils.toArray<Element>(targets).forEach((target, i) => {
    tl.fromTo(target, { ...from }, { ...vars, immediateRender: true }, position + i * each);
  });
  return tl;
}

/** Word-level masks — the `.mask > .text` pattern, generated. */
export function splitWords(el: Element) {
  return SplitText.create(el, { type: "words", mask: "words", wordsClass: "split-word" });
}

/** Line-level masks for large multi-line headings; re-splits on resize/font load. */
export function splitLines(el: Element, onSplit: (self: SplitText) => gsap.core.Animation | void) {
  return SplitText.create(el, {
    type: "lines",
    mask: "lines",
    linesClass: "split-line",
    autoSplit: true,
    onSplit,
  });
}

/**
 * Scene hand-off: the next section (pulled up 100svh in CSS) slides over the
 * previous sticky stage, which recedes as it gets covered.
 */
export function coverTransition(stage: Element, next: Element) {
  return gsap.fromTo(
    stage,
    { scale: 1, opacity: 1 },
    {
      scale: 0.93,
      opacity: 0.25,
      ease: "none",
      transformOrigin: "50% 0%",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true },
    }
  );
}

/** Compact-mode entrance: a one-shot rise, the only non-scrubbed motion in scenes. */
export function revealOnce(targets: Element | Element[], trigger?: Element, stagger = 0.08) {
  const list = Array.isArray(targets) ? targets : [targets];
  if (!list.length) return;
  return gsap.from(list, {
    y: 22,
    opacity: 0,
    duration: 0.7,
    ease: "power3.out",
    stagger,
    scrollTrigger: { trigger: trigger ?? list[0], start: "top 87%", once: true },
  });
}

/** Inner-media drift inside an overflow-clipped frame. */
export function parallax(target: Element, frame: Element, amount = 5) {
  return gsap.fromTo(
    target,
    { yPercent: -amount, scale: 1 + amount / 60 },
    {
      yPercent: amount,
      ease: "none",
      scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
    }
  );
}

/** Keep trigger positions honest once webfonts/media settle layout. */
export function refreshWhenSettled() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  if (document.readyState === "complete") ScrollTrigger.refresh();
  else window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

export { gsap, ScrollTrigger, SplitText };
