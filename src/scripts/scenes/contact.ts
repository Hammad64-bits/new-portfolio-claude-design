import { defineScene, finder, gsap, revealOnce, splitLines } from "./core";

/**
 * Scene 07 — Contact. Where the page settles.
 *
 * Cinematic: the closing line rises through line masks, scrubbed so it lands
 * exactly as the section arrives, and a rule draws across. After that nothing
 * moves — the calm is the point. CTAs and the form only get a one-shot rise.
 */
export const initContact = defineScene("contact", (root, mode) => {
  const { one, all } = finder(root);
  const title = one("[data-contact-title]");
  if (!title) return;

  if (mode.compact) {
    revealOnce([...all("[data-contact-reveal]").slice(0, 1), title, ...all("[data-contact-reveal]").slice(1)], root);
    return;
  }

  splitLines(title, (self) =>
    gsap.fromTo(
      self.lines,
      { yPercent: 105 },
      {
        yPercent: 0,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root, start: "top 75%", end: "top 15%", scrub: 0.5 },
      }
    )
  );

  const rule = one("[data-contact-rule]");
  if (rule) {
    gsap.fromTo(
      rule,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { trigger: root, start: "top 90%", end: "top 30%", scrub: true } }
    );
  }

  revealOnce(all("[data-contact-reveal]"), title, 0.12);
});
