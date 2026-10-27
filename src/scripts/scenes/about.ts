import { defineScene, finder, parallax, revealOnce } from "./core";

/**
 * Scene 06 — About. Subtle: each photograph drifts inside its own frame at a
 * slightly different depth, which is what makes them read as physical prints
 * rather than flat rectangles. No rotation — it read as gimmicky.
 */
export const initAbout = defineScene("about", (root, mode) => {
  const { all } = finder(root);

  revealOnce(all("[data-about-reveal]"), root, 0.1);

  const depths = mode.cinematic ? [5, 7, 9] : [3, 4, 5];
  all("[data-about-frame]").forEach((frame, i) => {
    const photo = frame.querySelector("[data-about-photo]");
    if (photo) parallax(photo, frame, depths[i % depths.length]);
  });
});
