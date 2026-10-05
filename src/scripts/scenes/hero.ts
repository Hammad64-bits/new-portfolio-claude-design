import { defineScene, finder, gsap, parallax, scrubTimeline, splitWords, ScrollTrigger } from "./core";

const DOT_ON = "#b9ff4d";
const DOT_OFF = "#3a3a36";

/**
 * Scene 01 — Hero.
 *
 * Cinematic timeline (~11 units over the sticky stage):
 *   0.0  headline line 1 holds, scroll cue fades
 *   1.4  line 1 → line 2, word by word through masks
 *   3.8  line 2 → line 3
 *   0–6  secondary copy drifts up at staggered rates; media gains depth
 *   6.6  copy exits; media frame opens outward to full bleed and darkens
 *   8.6  "Selected Work" title card rises through its masks
 *   9.7  hold — then Work (pulled up in CSS) slides over the receding stage
 */
export const initHero = defineScene("hero", (root, mode) => {
  const { one, all } = finder(root);
  const linesRoot = one("[data-hero-lines]");
  const lines = all(".hero-line");
  const dots = all(".hero-dot");
  if (!linesRoot || !lines.length) return;

  if (mode.compact) {
    const frame = one("[data-hero-frame]");
    const depth = one("[data-hero-depth]");
    if (frame && depth) parallax(depth, frame, 4);
    return timedCycler(linesRoot, lines, dots);
  }

  const stage = one("[data-stage]")!;
  const frame = one("[data-hero-frame]")!;
  const canvas = one("[data-hero-canvas]")!;

  // Stretch the canvas over the whole stage, offset so that inside the frame it
  // shows exactly what the frame used to show. The frame's clip-path then opens
  // from inset(0) to negative insets that reach the stage edges.
  let bleed = { top: 0, right: 0, bottom: 0, left: 0 };
  const measure = () => {
    // Layout offsets, not bounding rects: the stage may be mid-transform (cover
    // transition) when a refresh happens. The sticky stage is the offsetParent.
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const top = frame.offsetTop;
    const left = frame.offsetLeft;
    bleed = { top, left, right: w - left - frame.offsetWidth, bottom: h - top - frame.offsetHeight };
    gsap.set(canvas, { top: -top, left: -left, width: w, height: h, right: "auto", bottom: "auto" });
  };
  measure();
  ScrollTrigger.addEventListener("refreshInit", measure);

  const splits = lines.map((line) => splitWords(line));
  gsap.set(lines, { opacity: 1, y: 0 });
  splits.slice(1).forEach((s) => gsap.set(s.words, { yPercent: 110 }));
  if (dots.length) gsap.set(dots, { backgroundColor: (i: number) => (i === 0 ? DOT_ON : DOT_OFF) });

  const nextTitle = one("[data-next-title]")!;
  const nextSplit = splitWords(nextTitle);
  const nextMeta = all("[data-next-meta]");
  gsap.set(nextSplit.words, { yPercent: 105 });
  gsap.set(nextMeta, { yPercent: 110 });

  const copy = all("[data-hero-copy]");
  const eyebrow = one("[data-hero-eyebrow]");
  const decor = all("[data-hero-decor]");

  const tl = scrubTimeline(root, { end: "bottom 200%" });

  tl.to("[data-hero-cue]", { autoAlpha: 0, duration: 0.5 }, 0);

  // Depth: restrained push-in on the media while the headline does the work.
  tl.to("[data-hero-depth]", { scale: 1.08, yPercent: -3, duration: 6.6 }, 0);

  // Headline swaps. Words leave and arrive with a stagger, so the line breaks
  // apart at different speeds instead of crossfading as a block.
  // The incoming line only starts once the outgoing one has cleared its masks.
  const swap = (from: number, to: number, at: number) => {
    const out = splits[from].words;
    const outEnd = at + 0.45 + 0.03 * (out.length - 1);
    tl.to(out, { yPercent: -110, duration: 0.45, stagger: 0.03, ease: "power2.in" }, at);
    tl.to(splits[to].words, { yPercent: 0, duration: 0.6, stagger: 0.035, ease: "power3.out" }, outEnd - 0.05);
    if (dots.length) {
      tl.to(dots, { backgroundColor: (i: number) => (i === to ? DOT_ON : DOT_OFF), duration: 0.2 }, outEnd);
    }
  };
  swap(0, 1, 1.4);
  swap(1, 2, 3.8);

  // Secondary copy: each block on its own slower rate — parallax inside the column.
  if (eyebrow) tl.to(eyebrow, { y: -14, duration: 5.6 }, 0);
  copy.forEach((el, i) => tl.to(el, { y: -(22 + i * 16), duration: 5.6 }, 0));

  const EXIT = 6.6;

  // Exit (after line 3 has had a proper hold): copy lifts away, last headline line leaves through its masks.
  tl.to([eyebrow, ...copy], { y: "-=56", autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power2.in" }, EXIT);
  tl.to(splits[2].words, { yPercent: -110, duration: 0.7, stagger: 0.04, ease: "power2.in" }, EXIT + 0.1);
  tl.to(decor, { autoAlpha: 0, duration: 0.4 }, EXIT + 0.1);

  // Media opens to full bleed: the frame becomes the scene.
  tl.to(frame, { borderColor: "rgba(30,30,28,0)", duration: 0.3 }, EXIT + 0.4);
  tl.fromTo(
    frame,
    { clipPath: "inset(0px 0px 0px 0px)" },
    {
      clipPath: () => `inset(${-bleed.top}px ${-bleed.right}px ${-bleed.bottom}px ${-bleed.left}px)`,
      duration: 2,
      ease: "power2.inOut",
    },
    EXIT + 0.4
  );
  tl.to("[data-hero-dim]", { opacity: 0.62, duration: 2 }, EXIT + 1);

  // Title card for Scene 02.
  tl.set("[data-hero-next]", { autoAlpha: 1 }, EXIT + 1.9);
  tl.to(nextMeta, { yPercent: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" }, EXIT + 2);
  tl.to(nextSplit.words, { yPercent: 0, duration: 1, stagger: 0.12, ease: "power3.out" }, EXIT + 2.1);
  tl.to({}, { duration: 1.6 });

  return () => {
    ScrollTrigger.removeEventListener("refreshInit", measure);
  };
});

/** Original timed headline cycler, used where the scroll scene isn't. */
function timedCycler(root: HTMLElement, lines: HTMLElement[], dots: HTMLElement[]) {
  const holdSeconds = (Number(root.dataset.holdMs) || 4000) / 1000;

  gsap.set(lines, { opacity: 0, y: 26 });
  gsap.set(lines[0], { opacity: 1, y: 0 });
  if (dots[0]) gsap.set(dots[0], { backgroundColor: DOT_ON });

  const tl = gsap.timeline({ delay: holdSeconds });
  for (let i = 1; i < lines.length; i++) {
    tl.to(lines[i - 1], { opacity: 0, y: -26, duration: 0.7, ease: "power2.inOut" }, `step${i}`).to(
      lines[i],
      { opacity: 1, y: 0, duration: 0.7, ease: "power2.inOut" },
      `step${i}`
    );
    if (dots.length) {
      tl.to(dots, { backgroundColor: (d: number) => (d === i ? DOT_ON : DOT_OFF), duration: 0.3 }, `step${i}`);
    }
    if (i < lines.length - 1) tl.to({}, { duration: holdSeconds });
  }
}
