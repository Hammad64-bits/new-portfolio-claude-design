import { coverTransition, defineScene, finder, fromTo, revealOnce, scrubTimeline } from "./core";

/**
 * Scene 03 — Capabilities. Typography takes over.
 *
 * Cinematic: the section slides over the Work stage, then a sticky list steps
 * through the four disciplines. Each one in turn moves from inactive (dim,
 * offset right) to active (full, on the line, detail visible, rule drawn) to
 * passed (receded). One discipline is ever fully lit.
 */
export const initCapabilities = defineScene("capabilities", (root, mode) => {
  const { one, all } = finder(root);
  const caps = all("[data-cap]");
  if (!caps.length) return;

  if (mode.compact) {
    revealOnce(one("[data-caps-bar]")!);
    revealOnce(caps, caps[0]);
    return;
  }

  const workStage = document.querySelector('[data-scene="work"] [data-stage]');
  if (workStage) coverTransition(workStage, root);

  const titles = caps.map((c) => c.querySelector(".cap-title")!);
  const details = caps.map((c) => c.querySelector(".cap-detail")!);
  const rules = caps.map((c) => c.querySelector("[data-cap-rule]")!);

  const tl = scrubTimeline(root, { start: "top 45%" });

  caps.forEach((cap, i) => {
    const at = 0.2 + i;
    fromTo(tl, cap, { opacity: 0.18 }, { opacity: 1, duration: 0.45 }, at);
    fromTo(tl, titles[i], { xPercent: 6 }, { xPercent: 0, duration: 0.6, ease: "power3.out" }, at);
    fromTo(tl, details[i], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45 }, at + 0.15);
    fromTo(tl, rules[i], { scaleX: 0 }, { scaleX: 1, duration: 0.8 }, at);
    if (i < caps.length - 1) {
      tl.to(cap, { opacity: 0.38, duration: 0.45 }, at + 0.85);
      tl.to(titles[i], { xPercent: -1.5, duration: 0.6 }, at + 0.85);
    }
  });
  tl.to({}, { duration: 0.6 });
});
