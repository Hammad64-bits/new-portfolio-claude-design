import { defineScene, finder, fromTo, gsap, parallax, revealOnce, scrubTimeline, splitWords, SplitText } from "./core";

/**
 * Scene 02 — Selected Work. One sticky stage, two projects.
 *
 * Cinematic timeline (starts while the section is still sliding over the hero):
 *   0.0–1.6  RevSmith assembles: title letters rise, the demo frame opens from a
 *            crop, claim words come through masks, screenshots float in
 *   1.0–5.4  depth — frame, text and each screenshot drift at different rates
 *   3.8–5.4  hand-off — RevSmith recedes left/back, Vigilant enters from the
 *            right and its visual wipes open over RevSmith's frame
 *   6.2–7.6  the migration: "after" wipes across "before"
 */
export const initWork = defineScene("work", (root, mode) => {
  const { one, all } = finder(root);
  const rev = one('[data-project="revsmith"]');
  const vig = one('[data-project="vigilant"]');
  if (!rev || !vig) return;

  const pick = (article: HTMLElement) => ({
    meta: article.querySelector<HTMLElement>("[data-p-meta]")!,
    title: article.querySelector<HTMLElement>("[data-p-title]")!,
    claim: article.querySelector<HTMLElement>("[data-p-claim]")!,
    rest: Array.from(article.querySelectorAll<HTMLElement>("[data-p-body], [data-p-list], [data-p-cta]")),
    visual: article.querySelector<HTMLElement>("[data-p-visual]")!,
  });
  const R = pick(rev);
  const V = pick(vig);
  const frame = one("[data-p-frame]")!;
  const media = one("[data-p-media]")!;
  const shots = all("[data-p-shot]");

  if (mode.compact) {
    revealOnce(one("[data-work-bar]")!);
    [rev, vig].forEach((article) => {
      const p = pick(article);
      revealOnce([p.meta, p.title, p.claim, ...p.rest], article);
      revealOnce(p.visual);
    });
    revealOnce(shots, shots[0]);
    parallax(media, frame, 3);
    return;
  }

  const after = one("[data-compare-after]")!;
  const edge = one("[data-compare-edge]")!;
  const counters = all("[data-counter]");

  const revTitle = SplitText.create(R.title, { type: "chars", mask: "chars" });
  const revClaim = splitWords(R.claim);
  const vigTitle = Array.from(vig.querySelectorAll<HTMLElement>(".project-title-line"));
  const vigClaim = splitWords(V.claim);

  // Vigilant starts parked off to the right and is not interactive yet.
  gsap.set(counters[1], { yPercent: 100 });
  setActive(rev, vig);

  const tl = scrubTimeline(root, {
    start: "top 70%",
    end: "bottom 200%",
    // Swap which article is focusable/clickable at the middle of the hand-off.
    onUpdate: () => (tl.time() > HANDOFF + 0.8 ? setActive(vig, rev) : setActive(rev, vig)),
  });

  // — RevSmith assembles —
  fromTo(tl, R.meta.children, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.08 }, 0);
  fromTo(tl, revTitle.chars, { yPercent: 105 }, { yPercent: 0, duration: 0.8, stagger: 0.05, ease: "power3.out" }, 0.1);
  fromTo(
    tl,
    frame,
    { clipPath: "inset(16% 24% 16% 24%)" },
    { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power2.inOut" },
    0
  );
  fromTo(tl, media, { scale: 1.25 }, { scale: 1, duration: 1.3, ease: "power2.out" }, 0);
  fromTo(tl, revClaim.words, { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.03, ease: "power3.out" }, 0.6);
  fromTo(tl, R.rest, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1 }, 0.9);

  // — Depth: nothing moves at the same rate —
  const shotRise = [16, 26, 10]; // vh travelled per screenshot
  shots.forEach((shot, i) => {
    fromTo(
      tl,
      shot,
      { y: () => innerHeight * 0.3, autoAlpha: 0 },
      { y: () => -innerHeight * (shotRise[i] ?? 12) * 0.01, autoAlpha: 1, duration: 3.3 - i * 0.25, ease: "power1.out" },
      0.4 + i * 0.25
    );
  });
  tl.to(media, { yPercent: -4, duration: 3.6 }, 1.4);
  tl.to(R.title, { x: () => -innerWidth * 0.015, duration: 2 }, 1);
  tl.to([R.claim, ...R.rest], { yPercent: -2, duration: 2 }, 1.2);

  // — Hand-off: RevSmith → Vigilant —
  const T = HANDOFF;
  tl.to(frame, { scale: 0.88, duration: 1.4, ease: "power2.inOut" }, T);
  tl.to(frame, { autoAlpha: 0, duration: 0.3 }, T + 1.3);
  tl.to(R.title, { x: () => -innerWidth * 0.15, autoAlpha: 0, duration: 1.1, ease: "power2.in" }, T);
  tl.to([R.meta, R.claim, ...R.rest], { y: -40, autoAlpha: 0, duration: 0.7, stagger: 0.06, ease: "power2.in" }, T);
  shots.forEach((shot, i) => {
    tl.to(shot, { y: () => -innerHeight * (0.45 + i * 0.12), autoAlpha: 0, duration: 0.9, ease: "power2.in" }, T + i * 0.1);
  });
  tl.to(counters[0], { yPercent: -100, duration: 0.4 }, T + 0.5);
  tl.to(counters[1], { yPercent: 0, duration: 0.4 }, T + 0.5);

  fromTo(tl, V.meta, { x: () => innerWidth * 0.1, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out" }, T + 0.5);
  fromTo(
    tl,
    [vig.querySelector<HTMLElement>(".project-title-pre")!, ...vigTitle],
    { x: () => innerWidth * 0.2, autoAlpha: 0 },
    { x: 0, autoAlpha: 1, duration: 1.1, stagger: 0.12, ease: "power3.out" },
    T + 0.55
  );
  fromTo(
    tl,
    V.visual,
    { clipPath: "inset(0% 0% 0% 100%)" },
    { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power2.inOut" },
    T + 0.5
  );
  fromTo(tl, vigClaim.words, { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.03, ease: "power3.out" }, T + 1);
  fromTo(tl, V.rest, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1 }, T + 1.2);

  // — The migration, scrubbed: legacy WordPress → Astro + Sanity —
  const W = HANDOFF + 2.4;
  fromTo(tl, after, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power1.inOut" }, W);
  fromTo(tl, edge, { x: 0, autoAlpha: 1 }, { x: () => after.offsetWidth, duration: 1.4, ease: "power1.inOut" }, W);
  tl.to(edge, { autoAlpha: 0, duration: 0.2 }, W + 1.4);
  tl.to({}, { duration: 1 });

  return () => {
    [rev, vig].forEach((a) => (a.inert = false));
  };
});

const HANDOFF = 3.8;

function setActive(on: HTMLElement, off: HTMLElement) {
  if (!on.inert && off.inert) return;
  on.inert = false;
  off.inert = true;
}
