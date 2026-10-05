import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Weighted wheel scrolling for the homepage scroll scenes.
 *
 * Native wheel steps jump ~100px per notch, which flicks straight through
 * short animation beats. Lenis interpolates toward the target instead, and
 * scales wheel input down, so scrubbed timelines get read rather than skipped.
 * It keeps the real document scroll (unlike ScrollSmoother, which transforms
 * the content and would break the CSS position: sticky stages).
 *
 * Touch scrolling stays native (syncTouch off). Disabled entirely under
 * prefers-reduced-motion. Driven by GSAP's ticker so ScrollTrigger and Lenis
 * update in the same frame.
 */
let lenis: Lenis | null = null;

export function initSmoothScroll() {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const instance = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.75,
      anchors: true,
      autoRaf: false,
    });
    lenis = instance;

    instance.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      lenis = null;
    };
  });
}

/** Programmatic scroll that goes through Lenis when it's active. */
export function scrollToY(y: number) {
  if (lenis) {
    lenis.scrollTo(y);
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
}
