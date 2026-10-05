import { refreshWhenSettled } from "./scenes/core";
import { initSmoothScroll } from "./smooth";
import { initHero } from "./scenes/hero";
import { initWork } from "./scenes/work";
import { initCapabilities } from "./scenes/capabilities";
import { initExperience } from "./scenes/experience";
import { initLabs } from "./scenes/labs";
import { initAbout } from "./scenes/about";
import { initContact } from "./scenes/contact";

/**
 * Homepage choreography: one scene module per section, in document order.
 * Each owns a gsap.matchMedia() scoped to its section, so the cinematic /
 * compact / reduced versions swap (revert + rebuild) cleanly on resize. The
 * site is a multi-page build, so there's no client-side navigation to clean
 * up after; bfcache restores simply resume the live timelines.
 */
[initHero, initWork, initCapabilities, initExperience, initLabs, initAbout, initContact].forEach((init) => init());

initSmoothScroll();
refreshWhenSettled();
