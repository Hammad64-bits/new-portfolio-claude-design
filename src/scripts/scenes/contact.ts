import { defineScene, finder, gsap, revealOnce, scrubTimeline } from "./core";

/**
 * Scene 07 — Contact.
 *
 * The contact text is visible on arrival. A framed green corner box (bottom-right)
 * expands to fill the stage as the user scrolls through the 200svh section.
 *
 * Cinematic onLeave:
 *   1. Halves split apart (0.45s).
 *   2. Mid-animation, the page scrolls instantly to #hh-contact-main (hidden section
 *      sitting in normal page flow right after this scene).
 *   3. Halves finish — viewport is already at the contact section.
 *   4. Contact content fades in.
 *   5. URL updated with history.pushState('/contact').
 */
export const initContact = defineScene("contact", (root, mode) => {
  const { one, all } = finder(root);
  const title = one("[data-contact-title]");
  if (!title) return;

  if (mode.compact) {
    revealOnce(
      [...all("[data-contact-reveal]").slice(0, 1), title, ...all("[data-contact-reveal]").slice(1)],
      root
    );
    return;
  }

  const overlay  = one("[data-contact-overlay]");
  const leftHalf = one<HTMLElement>('[data-contact-half="left"]');
  const rightHalf = one<HTMLElement>('[data-contact-half="right"]');
  const label   = one("[data-contact-label]");
  const content = one("[data-contact-content]");
  if (!overlay || !leftHalf || !rightHalf || !content) return;

  // Hide the contact section that lives below — it will be revealed by the animation.
  const contactMain = document.getElementById("hh-contact-main");
  if (contactMain) gsap.set(contactMain, { autoAlpha: 0, pointerEvents: "none" });

  let triggered = false;

  const tl = scrubTimeline(root, {
    onLeave: () => {
      if (triggered) return;
      triggered = true;

      gsap.set(overlay,  { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set([content, label], { autoAlpha: 0 });

      gsap.timeline()
        // Halves slide apart
        .to(leftHalf,  { xPercent: -100, duration: 0.45, ease: "power2.inOut" })
        .to(rightHalf, { xPercent:  100, duration: 0.45, ease: "power2.inOut" }, 0)
        // Scroll to the contact section while the halves are still moving
        // (they cover the viewport, so the jump is invisible to the user)
        .call(() => {
          if (contactMain) {
            window.scrollTo({ top: contactMain.offsetTop, behavior: "instant" });
          }
        }, undefined, 0.2)
        // Reveal after the scroll + halves are done
        .call(() => revealContactMain(contactMain), undefined, 0.45);
    },
  });

  // Corner box expands to fill the stage
  tl.fromTo(
    overlay,
    { clipPath: "inset(72% 0% 0% 65%)" },
    { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 0.8 },
    0
  );

  if (label) tl.to(label, { autoAlpha: 0, duration: 0.3 }, 0);
  tl.to(content, { autoAlpha: 0, ease: "power1.in", duration: 0.4 }, 0.1);
});

function revealContactMain(section: HTMLElement | null) {
  if (!section) {
    window.location.href = "/contact";
    return;
  }

  gsap.set(section, { pointerEvents: "auto" });
  gsap.to(section, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });

  history.pushState({ contact: true }, "", "/contact");

  // Entrance animations scoped to the section
  const q  = (sel: string) => section.querySelector(sel);
  const qa = (sel: string) => Array.from(section.querySelectorAll(sel));

  const header = [q("[data-ci-eyebrow]"), q("[data-ci-heading]"), q("[data-ci-desc]")].filter(Boolean) as Element[];
  const formCol = q("[data-ci-form]");
  const video   = q("[data-ci-video]");
  const links   = qa("[data-ci-link]");

  if (header.length)  gsap.from(header,  { y: 28, autoAlpha: 0, duration: 0.7, stagger: 0.14, ease: "power3.out", delay: 0.05 });
  if (formCol)        gsap.from(formCol,  { x: -48, autoAlpha: 0, duration: 0.8, ease: "power2.out", delay: 0.2 });
  if (video)          gsap.from(video,    { x:  48, autoAlpha: 0, duration: 0.8, ease: "power2.out", delay: 0.2 });
  if (links.length)   gsap.from(links,    { x: -24, autoAlpha: 0, duration: 0.5, stagger: 0.09, ease: "power2.out", delay: 0.3 });

  // If the user hits back, reset the section so it can be revealed again
  window.addEventListener("popstate", () => {
    gsap.to(section, {
      autoAlpha: 0,
      pointerEvents: "none",
      duration: 0.2,
      ease: "power1.in",
    });
  }, { once: true });
}
