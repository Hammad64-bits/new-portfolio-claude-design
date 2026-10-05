import { defineScene, finder, gsap, revealOnce } from "./core";

/**
 * Scene 04 — Experience. Subtle by design.
 *
 * Cinematic: each row brightens and its title grows slightly as it crosses
 * the focal band at the middle of the viewport, then recedes. A thin progress
 * line along the list follows the reader.
 */
export const initExperience = defineScene("experience", (root, mode) => {
  const { one, all } = finder(root);
  const rows = all("[data-exp-row]");
  if (!rows.length) return;

  if (mode.compact) {
    revealOnce(one("[data-exp-bar]")!);
    revealOnce(rows, rows[0]);
    return;
  }

  rows.forEach((row) => {
    const title = row.querySelector("[data-exp-title]")!;
    gsap
      .timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: row, start: "top 80%", end: "bottom 20%", scrub: 0.4 },
      })
      .fromTo(row, { opacity: 0.28 }, { opacity: 1, duration: 1 })
      .fromTo(title, { scale: 1 }, { scale: 1.12, duration: 1 }, 0)
      .to({}, { duration: 0.4 })
      .to(row, { opacity: 0.42, duration: 1 })
      .to(title, { scale: 1, duration: 1 }, "<");
  });

  const progress = one("[data-exp-progress]");
  if (progress) {
    gsap.fromTo(
      progress,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: rows[0], endTrigger: rows[rows.length - 1], start: "top 50%", end: "bottom 50%", scrub: true },
      }
    );
  }
});
