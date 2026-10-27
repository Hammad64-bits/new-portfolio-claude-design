import { defineScene, finder, gsap, revealOnce, scrubTimeline } from "./core";

/**
 * Scene 05 — Labs. The one horizontal sequence on the page.
 *
 * Cinematic: input stays vertical; scroll progress through the tall section
 * translates the track sideways. Behind it a ghost "Labs — 04" drifts the
 * other way at a fraction of the speed, each experiment bobs vertically at
 * its own rate, and captions lag slightly behind their cards.
 */
export const initLabs = defineScene("labs", (root, mode) => {
  const { one, all } = finder(root);
  const track = one("[data-labs-track]");
  const labs = all("[data-lab]");
  if (!track || !labs.length) return;

  if (mode.compact) {
    revealOnce([one("[data-labs-bar]")!, one("[data-labs-title]")!, one("[data-labs-link]")!], root);
    revealOnce(labs, track);
    return;
  }

  const stage = one("[data-stage]")!;
  // Slide until the last card sits as far from the right edge as the first did
  // from the left. The sticky stage is the track's offsetParent.
  const travel = () => Math.max(0, track.offsetLeft * 2 + track.scrollWidth - stage.clientWidth);

  const tl = scrubTimeline(root, { scrub: 0.8 });
  tl.fromTo(track, { x: 0 }, { x: () => -travel(), duration: 1 }, 0);
  tl.fromTo("[data-labs-ghost]", { xPercent: 0 }, { xPercent: -22, duration: 1 }, 0);

  const bob = [-6, 8, -10, 5]; // svh-ish, alternating directions and speeds
  labs.forEach((lab, i) => {
    const amp = bob[i % bob.length];
    tl.fromTo(lab, { yPercent: amp }, { yPercent: -amp, duration: 1 }, 0);
    const caption = lab.querySelector("[data-lab-caption]");
    if (caption) tl.fromTo(caption, { x: 40 }, { x: -20, duration: 1 }, 0);
  });

  // Heading parts settle at different speeds as the scene opens.
  tl.fromTo("[data-labs-title]", { y: 0 }, { y: -18, duration: 1 }, 0);
  gsap.set(track, { willChange: "transform" });
});
