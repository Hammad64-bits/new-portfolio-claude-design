# Portfolio Animation Audit

Audit date: 2026-09-08  
Scope: dependency files, the complete `src/` tree, and rendered checks at desktop and mobile sizes.  
Constraint: diagnostic only. No project source, dependency, configuration, or generated file was changed. This report is the only added project file.

Rendered-check note: the checkout's dev server cannot currently start because `astro.config.mjs:15` ends with `});c`, producing `c is not defined`. To avoid changing the checkout, rendered checks used a temporary `/tmp` copy with only that trailing character removed. The checked-in `dist/` was not treated as current because it predates the latest motion source. This allowed current source behavior to be observed without modifying the project.

## 1. Executive Summary

Animation is implemented through one global TypeScript entry point, a small global CSS layer, Tailwind transition utilities, two page-local scripts, and autoplay media. GSAP 3.15.0 is the only installed motion library. `ScrollTrigger` is imported from GSAP and used for homepage reveals plus non-animated header/scroll-to-top state toggles.

There is the beginning of a reusable system, not a coherent finished system. The strongest reusable concepts are `data-reveal`, `data-reveal-group`/`data-reveal-item`, two shared GSAP eases, the nav indicator, the hero headline timeline, and a global page-wipe handler. These all live in `src/scripts/motion.ts`, which is a sensible central entry point. However:

- The reveal system is broad and generic: almost every homepage section gets the same fade-and-rise treatment regardless of content purpose.
- It is also inconsistently adopted: the homepage has 14 single reveals, 8 reveal groups, and 28 staggered child items, while the standalone Work, Labs, About, Contact, case-study, and Labs-detail pages have no reveal hooks.
- Many color/border hover states are instantaneous, while similar controls use 150 ms, 180 ms, 200 ms, 250 ms, or 300 ms transitions.
- Seven videos autoplay simultaneously on the homepage in the rendered desktop check, including media more than 4,500–5,400 px below the viewport. Five do the same on the Labs index. Reduced motion stops their CSS drift but not video playback.
- The custom page transition is purposeful and visually specified, but it delays real navigation by 520 ms and animates `width` on every frame. It is outgoing-only rather than a true content-preserving route transition.

The most promising existing pieces are the nav indicator, the semantic grouping attributes, the restrained scroll-top treatment, and the reduced-motion gating around GSAP. The largest opportunities are to make motion coverage intentional by area, give project media and Labs filtering meaningful state transitions, and consolidate durations/eases. The largest risks are ubiquitous reveal motion, continuously active off-screen media, layout work during the page wipe, and lifecycle assumptions that are safe only while navigation remains full-page.

## 2. Dependency Inventory

| Dependency / facility | Version | Installed or referenced | Imported where | Actual status |
|---|---:|---|---|---|
| GSAP | `3.15.0` exact in lockfile; `^3.15.0` manifest | Installed production dependency | `src/scripts/motion.ts:1` | Active. Drives reveals, the headline timeline, and page wipe. |
| GSAP ScrollTrigger | Bundled with GSAP `3.15.0` | No separate package | `src/scripts/motion.ts:2`; registered at line 4 | Active. Used by every reveal and two global scroll-state controllers. |
| Lenis | — | Not installed or referenced | — | Absent. |
| Locomotive Scroll | — | Not installed or referenced | — | Absent. |
| Framer Motion | — | Not installed or referenced | — | Absent. |
| Motion / Motion One | — | Not installed or referenced | — | Absent. The word “Motion” in capability copy is content, not an import. |
| anime.js | — | Not installed or referenced | — | Absent. The word “anime” in Figure Sentry copy is unrelated. |
| AOS | — | Not installed or referenced | — | Absent. |
| Astro View Transitions / `ClientRouter` | Provided by Astro if imported, but not imported | Not referenced | — | Not used. |
| Native View Transition API / `document.startViewTransition` | Browser API | Not referenced | — | Not used. |
| IntersectionObserver/helper libraries | — | Not installed or referenced | — | Absent. ScrollTrigger replaces this role for reveals. |
| Other animation utilities | — | None found | — | Absent. Tailwind supplies general transition utilities, not an animation architecture. |

No motion dependency appears leftover. GSAP is both declared and actively imported. `npm ls --depth=0` resolves GSAP to 3.15.0.

## 3. Existing Animation Architecture

The project has five motion layers:

1. **Global GSAP entry point** — Every page loads `initMotion()` from `src/layouts/Layout.astro:55-58`. `src/scripts/motion.ts` contains reveal setup, hero cycling, nav indicator logic, page wipe, gallery lightbox behavior, header scroll state, and scroll-to-top behavior.
2. **Global CSS motion** — `src/styles/global.css` defines three keyframes and global transitions for the nav indicator, sticky-header state, all `img.object-cover`/`img.object-scale-down` elements, and scroll-to-top control.
3. **Tailwind utilities** — Contact controls, the Labs filter buttons, the About photography CTA, and the loader-spec letters use local `transition-*` and `duration-*` utilities. Many other hover states have no transition utility and therefore change immediately.
4. **Page-local scripts** — `src/pages/labs.astro` performs instant `display` filtering. `src/pages/loader-spec.astro` contains a separate requestAnimationFrame implementation of the page-wipe demo. `src/components/ContactForm.astro` switches classes for tabs and a simulated submit state.
5. **Autoplay media plus CSS drift** — Hero, Labs, About, and Contact videos autoplay and loop; many also receive the shared `hh-drift` transform animation.

The architecture is centralized enough to evolve, but the behavior is not consistently modeled as purposeful tokens or named effects. Only two easing constants are shared. Durations, CSS eases, hover transitions, and media-loop lengths remain scattered.

Lifecycle is based on classic multi-page navigation. `initMotion()` does not return and dispose its `gsap.matchMedia()` context; the two global `ScrollTrigger.create()` instances and DOM listeners have no explicit cleanup. Full document unload currently clears them in practice. This would become a real duplication/leak problem if Astro client-side routing or persistent layouts were introduced later.

## 4. Existing Presets / Reusable Patterns

### Single-element reveal

- **Name / description:** `[data-reveal]` fade-and-rise reveal.
- **File:** `src/scripts/motion.ts:17-32`.
- **Trigger:** ScrollTrigger when the element top reaches 87% of the viewport; `once: true`.
- **Properties:** `opacity: 0 → authored value`, `y: 22 → 0`.
- **Duration:** 700 ms.
- **Delay:** None.
- **Easing:** shared `power3.out` (`EASE_OUT`).
- **Stagger:** None.
- **Reusability:** High technically; low semantic specificity. Any element can opt in with one attribute.
- **Used:** Homepage Work, Capabilities, Experience, Labs, About, and Contact components. Fourteen live instances. No instances on standalone pages.

### Group reveal

- **Name / description:** `[data-reveal-group] > [data-reveal-item]` staggered child reveal.
- **File:** `src/scripts/motion.ts:34-51`.
- **Trigger:** ScrollTrigger when group top reaches 85% of viewport; `once: true`.
- **Properties:** `opacity: 0 → authored value`, `y: 20 → 0`.
- **Duration:** 600 ms per child.
- **Delay:** None.
- **Easing:** shared `power3.out`.
- **Stagger:** 80 ms.
- **Reusability:** High. Direct-child requirement is an implicit structural constraint.
- **Used:** Homepage Work widget list, Work screenshots, Vigilant steps/images, Capabilities, Experience, Labs, and About media. Eight groups and 28 live items.

### Hero headline sequence

- **Name / description:** Timed three-line headline replacement.
- **File:** `src/scripts/motion.ts:54-92`; markup in `src/components/Hero.astro:25-34`.
- **Trigger:** Page initialization when `[data-hero-lines]` exists.
- **Properties:** `opacity` and vertical `y` of 26 px; dot background colors.
- **Duration:** 700 ms per line change; 300 ms per dot change.
- **Delay:** 4,000 ms default initial hold, configurable through `data-hold-ms`.
- **Easing:** `power2.inOut` for lines; GSAP default ease for dot colors because none is declared.
- **Stagger:** None; outgoing and incoming lines start simultaneously.
- **Reusability:** Medium. It is parameterized by line count and hold duration but hard-wired to global hero-dot selectors and fixed colors/distances.
- **Used:** Homepage hero only.

Exact default timeline:

| Time after initialization | State |
|---:|---|
| 0–4.0 s | Line 1 is static and visible. Other lines sit 26 px below at zero opacity. |
| 4.0–4.7 s | Line 1 moves to `y:-26` and fades out while line 2 moves from `y:26` and fades in. Dots change over the first 300 ms. |
| 4.7–8.7 s | Line 2 holds. |
| 8.7–9.4 s | Line 2 exits and line 3 enters using the same 700 ms cross-move. Dots update over 300 ms. |
| After 9.4 s | Line 3 remains. The timeline does not loop. |

There is no video switching. The three bars are headline progress/state dots, not carousel controls. The single `glowing_cubes.mp4` continues throughout. There is no hero eyebrow, paragraph, CTA, status-line, media-load, parallax, or scroll-exit animation.

### Nav underline indicator

- **Name / description:** Shared underline that travels and resizes between primary nav links.
- **Files:** `src/scripts/motion.ts:94-136`; `src/styles/global.css:58-79`; markup in `src/components/Header.astro:25-30`.
- **Trigger:** Mouse enter, keyboard focus, mouse leave, focus out, active route initialization, and resize.
- **Properties:** CSS custom properties feed `translateX`, `scaleX`, and `opacity`.
- **Duration:** 300 ms transform; 200 ms opacity.
- **Delay:** None.
- **Easing:** `cubic-bezier(.2,.7,.2,1)` transform; `ease` opacity.
- **Stagger:** None.
- **Reusability:** Medium-high within one horizontal nav. Geometry is measured rather than hard-coded.
- **Used:** Work, Labs, About, and Contact links on every standard page. No active underline on the homepage because no primary link is marked active there.

### Header density state

- **Name / description:** Sticky header background/border state after four pixels of scroll.
- **Files:** `src/scripts/motion.ts:285-294`; `src/styles/global.css:81-88`.
- **Trigger:** A dedicated ScrollTrigger updates `is-scrolled` when scroll exceeds 4 px.
- **Properties:** Background color and border color actually change. `backdrop-filter` is declared in the transition list but has no changed destination value.
- **Duration:** 300 ms.
- **Easing:** `ease`.
- **Reusability:** Specific to the site header.
- **Used:** Every page with `Header`.

### Scroll-to-top state

- **Name / description:** Reveal and invoke global scroll-to-top button.
- **Files:** `src/scripts/motion.ts:296-309`; `src/styles/global.css:144-161`; markup in `src/layouts/Layout.astro:32-39`.
- **Trigger:** Dedicated ScrollTrigger toggles visibility after 600 px. Click calls native `window.scrollTo`.
- **Properties:** Opacity and `translateY(6px)`; border and color on interaction.
- **Duration:** 250 ms reveal; 200 ms color/border. Reduced motion keeps a 150 ms opacity/color treatment and removes transform.
- **Easing:** `ease`.
- **Reusability:** Global.
- **Used:** Every page.

### Global image hover zoom

- **Name / description:** Scale any `img.object-cover` or `img.object-scale-down` when the image itself is hovered.
- **File:** `src/styles/global.css:121-142`.
- **Trigger:** Pointer hover directly over the image.
- **Properties:** `transform: scale(1.05)`.
- **Duration:** 600 ms.
- **Easing:** `cubic-bezier(.2,.7,.2,1)`.
- **Reusability:** Very broad, arguably over-broad. It affects interactive and non-interactive photography/screenshots alike.
- **Used:** Homepage work screenshots and About images, standalone About gallery, work/case-study images, and other matching media.

### `hh-drift`

- **Name / description:** Slow continuous scale-and-diagonal media drift.
- **File:** `src/styles/global.css:44-48`; applied inline across Hero, Labs, About, and Contact.
- **Trigger:** Immediately on render; infinite.
- **Properties:** Scale 1.04 → 1.10 → 1.04 and `translate3d(0,0,0) → (-1.5%,-1.5%,0) → 0`.
- **Duration:** 18, 20, 22, 24, or 26 seconds depending on instance.
- **Easing:** `ease-in-out` between keyframes.
- **Stagger / delay:** None.
- **Reusability:** High, with scattered duration values.
- **Used:** One homepage hero video, four homepage Labs videos, one homepage About video, five Labs-index videos, one About-page video, and one Contact-page video.

### `hh-blink`

- **Name / description:** Availability/status indicator blink.
- **File:** `src/styles/global.css:35-38`.
- **Trigger:** Immediately; infinite.
- **Properties:** Opacity stays at 1 through 60%, then changes sharply to .25 from 61–100%.
- **Duration:** 2.4 seconds.
- **Easing:** CSS shorthand does not name one; browser interpolation uses the default easing on keyframe segments, but the 1% boundary makes it read almost as a step.
- **Used:** Homepage hero status, About-page current status, Contact-page response status.
- **Rating note:** It communicates “live/current,” but the continuous pulse competes with a restrained system if repeated.

### `hh-spin`

- **Name / description:** Form submit spinner.
- **File:** `src/styles/global.css:40-42`; `src/components/ContactForm.astro:107-110`.
- **Trigger:** Submit script removes `hidden` for a simulated 900 ms busy phase.
- **Properties:** Rotation to 360 degrees.
- **Duration:** 700 ms.
- **Easing:** Linear; infinite while shown.
- **Reusability:** Shared through a keyframe name, but currently used once.

### Page-transition wipe

- **Name / description:** Full-screen split-panel outgoing navigation wipe with wordmark and snapped counter.
- **Files:** `src/scripts/motion.ts:138-224`; overlay markup in `src/layouts/Layout.astro:41-51`.
- **Trigger:** Document-level interception of eligible same-origin link clicks. Modified clicks, downloads, external links, `_blank`, and same-path links are bypassed. Reduced motion also bypasses it.
- **Properties:** Panel width, seven letter colors, counter opacity/text, and tick width.
- **Duration:** 520 ms, then `window.location.assign()`.
- **Easing:** Custom sampled equivalent of `cubic-bezier(.72,0,.18,1)`.
- **Stagger:** Letters flip according to their spatial centers across a 38–62% band; the counter snaps `0 → 29 → 57 → 84 → 100`.
- **Reusability:** Global for standard links, but tightly coupled to fixed overlay nodes and “Hammad.”
- **Used:** Every route through the shared Layout. This is a real page-exit treatment, not Astro View Transitions.

### Photography lightbox

- **Name / description:** CSS opacity open/close and image replacement fade.
- **Files:** `src/pages/pics.astro:159-229`; controller in `src/scripts/motion.ts:226-283`.
- **Trigger:** Grid item click, close/backdrop click, arrows, or keyboard.
- **Properties:** Overlay opacity (300 ms), replacement image opacity (150 ms), button border/color (200 ms).
- **Easing:** `ease`.
- **Reusability:** Page-specific but reasonably encapsulated with data attributes.
- **Used:** `/pics` only.

### Contact field/tab/status transitions

- **Name / description:** Local Tailwind color and status changes.
- **File:** `src/components/ContactForm.astro`.
- **Trigger:** Input hover/focus, project-type click, submit state.
- **Properties:** Colors at 180 ms for inputs/textarea/submit; colors at 150 ms for tabs; status opacity at 300 ms. Focus border color itself is supplied by global CSS.
- **Easing:** Tailwind default easing.
- **Reusability:** Component-local.
- **Used:** Homepage and Contact page.

### Labs filter state

- **Name / description:** Filter-pill color transition plus instant card removal.
- **File:** `src/pages/labs.astro:166-181,262-288`.
- **Trigger:** Filter button click.
- **Properties:** Button `transition-all` at 150 ms. Cards switch `display` between their authored display and `none` with no motion.
- **Reusability:** Page-specific.
- **Used:** `/labs` only.

### Loader-spec demo

- **Name / description:** Standalone requestAnimationFrame recreation of the production page wipe.
- **File:** `src/pages/loader-spec.astro:230-348`.
- **Trigger:** Demo buttons on `/loader-spec`.
- **Properties:** Panel/tick width, letter and nav colors, counter opacity/text, and content replacement.
- **Duration/easing:** 520 ms; separately implemented sampled `cubic-bezier(.72,0,.18,1)`. Glyphs also have a 60 ms Tailwind color transition.
- **Reusability:** Low. It duplicates production math for a demonstration route.
- **Used:** `/loader-spec` only; not called by real navigation.

No text-splitting library, animation wrapper component, shared duration token object, `gsap.context`, `quickTo`, `quickSetter`, page-transition component, IntersectionObserver helper, or scroll interpolation helper exists.

## 5. Page-by-Page Motion Audit

### Navigation

- No initial entrance animation.
- Primary desktop links get a reusable moving underline on hover/focus and on active standalone routes. Link text color changes are mostly instantaneous because the header links do not declare a color transition.
- Homepage navigation has no active link, and there is no section-aware scroll spy. The underline appears only during hover/focus and disappears afterward.
- Logo has no interaction treatment beyond link behavior. GitHub and CV only change color instantly; their current `href="#"` means they do not navigate and the page wipe ignores them as same-path links.
- Header is sticky, not fixed. After 4 px it transitions to a more opaque background/border state. No hide/reveal-on-scroll behavior exists.
- There is no mobile menu and therefore no mobile menu animation. At a 375 px rendered viewport the navigation wraps into a roughly 115 px-tall header with all four main links still exposed; no menu button exists.
- Classification: underline **A/B**; header state **B**; instantaneous auxiliary-link states **B**; absent home active state is a gap rather than a removal candidate.

### Hero

- There is no entrance timeline for the eyebrow, first headline, paragraph, CTAs, status, or media.
- The only orchestrated hero motion is the delayed three-line sequence documented above. It starts after four seconds, completes after about 9.4 seconds, and does not loop.
- Headline and progress dots are synchronized. The media is not: there is one autoplay video, not a carousel, and the dots are not interactive.
- The video has a 22-second infinite drift plus its own looping playback. There is no load reveal, parallax, pointer response, viewport pause, or scroll exit behavior.
- CTA/background and border/text hover changes are instantaneous because they have hover utilities but no transition utilities.
- Rendered verification matched the source: line 1 remained visible around 1 second; around 5 seconds line 2 was nearly settled while line 1 was nearly out.
- Classification: headline concept **B**; media drift **C**; status blink **B**; untransitioned CTA states **B**.

### Work

Homepage Selected Work:

- Section label, project headings, RevSmith video frame, metadata/widget groups, screenshots, Vigilant steps, and Vigilant images use the generic single/group reveals.
- There is no clip/mask reveal, project-level sequencing, sticky/pinned storytelling, screenshot parallax, or section transition.
- All matching images receive the global 600 ms hover zoom, even when the containing frame is not a link. The RevSmith autoplay video does not zoom.
- The RevSmith widget tiles change background instantly; case-study links have no explicit hover motion.

Standalone `/work` and case studies:

- `/work`, `/work/revsmith`, and `/work/vigilant-security` have zero reveal hooks. Their content and media are static except global image hover zoom, nav/header/scroll-top behavior, and outgoing page wipe.
- `/work` has one autoplay looping RevSmith video. The RevSmith case study's procedural/demo video is intentionally non-autoplay (`preload="none"`) and remained paused in the render check.
- No pinned/sticky work sections or image/video parallax were found.
- Classification: homepage reveal coverage **C** because it is generic and differs from the dedicated pages; image zoom **C**; non-autoplay case-study video behavior **A**.

### Capabilities

- One heading row uses the single reveal.
- Four capability items use the group reveal: 600 ms `power3.out`, 80 ms stagger.
- This is restrained in amplitude, but it is the same generic treatment used across more expressive media sections. The effect is useful for reading order yet should be standardized with the eventual system rather than treated as a section-specific idea.
- Classification: **B — Keep but standardize**.

### Experience

- One heading row uses the single reveal.
- Five timeline rows use the group reveal at 80 ms stagger.
- Reading order is clear, but animation adds roughly 320 ms between first and last starts on top of the 600 ms item duration. It remains modest and does not move the timeline itself.
- Classification: **B — Keep but standardize**.

### Labs

Homepage Labs:

- Section label and headline use single reveals; four media cards stagger in as a group.
- Each card's video also runs continuous drift at 20–26 seconds while the underlying video loops.
- No hover treatment on the card container, no media swap, no horizontal motion, and no scroll-linked/pinned layout exists.

Standalone Labs:

- No section/card entrance effects exist.
- Five featured videos autoplay and drift continuously at 18–26 seconds. Rendered mobile checks showed all five playing even when four were far below the viewport.
- Filter pills animate all properties for 150 ms, but the cards themselves disappear/reappear immediately through `display:none`. There is no spatial continuity, reflow transition, opacity transition, or announcement of the changed result count.
- Labs detail pages are static except global site behavior.
- Classification: video playback itself supports an alive/experimental tone **A/B**; universal continuous drift **C**; instant filter replacement **C**.

### About

Homepage About:

- Section label, profile block, lead paragraph, and two smaller media tiles use generic reveals.
- Profile/gallery images use the global hover zoom. The video loops and drifts for 24 seconds.

Standalone About:

- No entrance, gallery reveal, sequencing, or scroll-linked behavior exists.
- Photography is arranged with a static offset composition. All images zoom independently when directly hovered, even though they are not links or controls. This adds movement but does not clarify interaction.
- The single video autoplays with a 24-second drift; current-status dot blinks.
- The gallery has visual hierarchy through layout, not through motion. Existing motion adds personality only in the broadest sense and is not tied to meaning.
- Classification: layout **A but static**; non-interactive photo hover zoom **C**; video drift **C**.

### Contact

- Homepage Contact label, heading, and CTA row use single reveals. The form itself does not.
- Contact fields transition background colors at 180 ms. Focus border color changes through global CSS; the focus rule does not itself specify a transition, but the input's `transition-colors` covers it.
- Project-type tabs transition colors at 150 ms. There is no moving selection indicator or content replacement.
- Submit uses a 700 ms linear spinner while a hard-coded 900 ms timer simulates sending. Status opacity transitions over 300 ms. No validation/shake/error motion exists.
- The standalone Contact page has no section entrance. Its video autoplays/drifts for 26 seconds and its availability dot blinks. Sidebar link colors change instantly.
- Classification: field/tab feedback **A/B**; spinner **A** as a feedback pattern, although the submission is currently simulated; contact video drift **C**; generic section reveals **B/C**.

### Footer

- Entirely static.
- No entrance, hover, nav transition, or back-to-top relationship exists inside the footer itself.
- The global scroll-to-top button appears above it after 600 px, but it is owned by Layout rather than Footer.
- Classification: static treatment is appropriate; no animation is required solely for completeness.

## 6. Scroll Behavior

- **Native scrolling:** Yes. The document uses normal browser scrolling.
- **Smooth scrolling library:** None.
- **Native smooth scroll:** Only the scroll-to-top button uses `window.scrollTo({behavior:"smooth"})`; reduced motion switches this to `auto`.
- **CSS `scroll-behavior:smooth`:** Not present.
- **ScrollTrigger:** Active. The homepage creates 22 reveal triggers (14 singles plus 8 groups), and all pages with Layout can create two global triggers for header state and scroll-top state. At homepage load that is 24 ScrollTrigger instances.
- **IntersectionObserver:** None.
- **Direct scroll/wheel listeners:** None found.
- **Sticky/pinned behavior:** Sticky header only. No pinned content and no ScrollTrigger `pin` usage.
- **Scroll-linked timelines/scrubbing:** None. No `scrub`, progress-driven animation, parallax, `animation-timeline`, or `view-timeline` was found.
- **Custom RAF scroll interpolation:** None.
- **`requestAnimationFrame`:** One frame is used to align the active nav underline after layout. The separate `/loader-spec` demo runs its own 520 ms RAF loop. GSAP/ScrollTrigger naturally uses its internal ticker.

This is native scrolling with viewport-entry triggers, not smooth scrolling or scroll hijacking.

## 7. Timing & Easing Inventory

There are no named CSS duration tokens. The table groups repeated source values by purpose; `0 ms` captures the many hover states that change instantly.

| Token/pattern | Duration | Easing | Used in |
|---|---:|---|---|
| Instant hover/state | 0 ms | none | Header link colors, logo/auxiliary links, most CTAs, Work tiles, case-study cards, sidebar links |
| Loader demo glyph color | 60 ms | Tailwind default | `/loader-spec` demo only |
| Group stagger gap | 80 ms | n/a | Reveal-group child start spacing |
| Fast control color | 150 ms | Tailwind default | Contact tabs, Labs filter pills, About photography CTA; reduced-motion scroll-top |
| Form control color | 180 ms | Tailwind default | Contact inputs, textarea, submit button |
| Fast border/color | 200 ms | `ease` | Nav opacity, scroll-top hover, lightbox controls |
| Scroll-top / gallery index | 250 ms | `ease` | Scroll-top opacity/translate; photo index reveal |
| Standard UI state | 300 ms | `ease` | Header background/border, lightbox overlay, Contact status opacity |
| Nav travel | 300 ms | `cubic-bezier(.2,.7,.2,1)` | Primary nav underline transform |
| Photo filter | 400 ms | `ease` | `/pics` grayscale/contrast removal |
| Photography hover zoom | 500 ms | `cubic-bezier(.2,.7,.2,1)` | `/pics` bento images |
| Page exit wipe | 520 ms | sampled `cubic-bezier(.72,0,.18,1)` | Global page navigation and loader demo |
| Group reveal | 600 ms | `power3.out` | `[data-reveal-group]` children |
| Global image zoom | 600 ms | `cubic-bezier(.2,.7,.2,1)` | All matching object-cover/object-scale-down images |
| Single reveal | 700 ms | `power3.out` | `[data-reveal]` |
| Hero line change | 700 ms | `power2.inOut` | Hero headline |
| Submit spinner | 700 ms/turn | `linear` | Contact submit busy state |
| Simulated submit wait | 900 ms | n/a | Contact form script; a delay, not a tween |
| Status blink | 2.4 s | default keyframe easing | Hero/About/Contact status dots |
| Hero hold | 4.0 s | n/a | Before/between headline changes |
| Media drift variants | 18, 20, 22, 24, 26 s | `ease-in-out` | Hero, Labs, About, Contact videos |

The clearest inconsistency is micro-interaction timing: equivalent color/border feedback ranges from instant to 150, 180, 200, 250, and 300 ms. Easing is split across unnamed Tailwind defaults, CSS `ease`, `ease-in-out`, the shared `.2/.7/.2/1` curve, GSAP `power3.out`, GSAP `power2.inOut`, GSAP's undeclared default on hero dots, and the custom wipe curve. The 18–26 second drift variations appear aesthetic rather than semantic.

**Count:** 18 distinct source-level CSS animation/transition patterns were found when repeated instances are grouped by behavior and the loader-spec route is included. Reduced-motion overrides are treated as variants of their parent pattern, not additional patterns.

## 8. Transitional Animation Inventory

| Transition area | Current implementation | Finding |
|---|---|---|
| Page exit | Custom GSAP wipe before `window.location.assign` | Exists; 520 ms outgoing-only full-screen treatment. |
| Page entry | Dark document background only | No incoming animation or coordinated reveal. |
| Route transition | Classic full navigation | No Astro View Transitions, native View Transition API, SPA swap, or persisted component. |
| Nav active route | Moving CSS underline initialized from route prop | Exists on standalone routes; no homepage section tracking. |
| Section-to-section | Independent ScrollTrigger fade/rise effects | Homepage only; no actual transition connecting adjacent sections. |
| Project-to-case-study | Global page wipe | No project-image continuity or shared element transition. |
| Image-to-image | `/pics` lightbox fades replacement image opacity | Exists only in the photography lightbox; no shared-element motion. |
| Labs filters | Button colors transition; cards switch `display` instantly | No content transition or layout continuity. |
| Contact tabs | Button colors transition | No panel/content replacement is involved. |
| Case-study navigation | Related links invoke global page wipe | No case-study-specific previous/next transition. |

The project uses **custom GSAP page-exit motion plus CSS UI transitions**. It does not use Astro View Transitions or the native View Transition API.

## 9. Performance Findings

### High priority

1. **Off-screen autoplay video:** Seven videos were playing simultaneously on the rendered homepage; five played simultaneously on `/labs`. Videos several thousand pixels below the viewport were active. Reduced-motion mode did not pause them. Preload is mostly `metadata`, which helps initial network cost, but autoplay still begins decoding/painting once loaded.
2. **Continuous transforms on large media layers:** Every drift-enabled video animates transform forever, often across large card surfaces. These are compositor-friendly properties, but continuous work across many off-screen videos is unnecessary. Mobile showed the same off-screen playback.
3. **Layout-triggering page wipe:** Production page transition writes panel `width` and tick `width` on every GSAP update. Width changes require layout/paint, unlike a transform-based wipe. It also updates seven letter colors and counter text during the 520 ms navigation delay.

### Medium priority

- Homepage uses 24 ScrollTrigger instances: 22 reveals plus header and scroll-top controllers. This is not automatically excessive, but many triggers implement the same generic effect and could become noisy as content grows.
- Header declares a `backdrop-filter` transition. The blur value does not currently change between states, so this declaration is unnecessary; animating blur on a large sticky surface would be expensive if a changed value were added later.
- `/pics` animates `filter` from grayscale/contrast to none over 400 ms. It is hover-local rather than continuous, but filter animation is more expensive than opacity/transform.
- Global image hover zoom can promote many large screenshots/photos and applies to non-interactive media. It is broad enough to create incidental motion and layer cost.
- `transition-all` on Labs filter pills is wider than needed. It currently affects small controls, so cost is low, but it weakens predictability.
- Page-wipe `playThenGo()` has no `playing` guard. Rapid repeated eligible clicks can start multiple tweens/navigation assignments.

### Lifecycle risks

- `gsap.matchMedia()` is not retained/reverted by `initMotion()`.
- ScrollTriggers created by `initHeaderScroll()` and `initScrollTop()` are not explicitly killed.
- Nav, document-click, resize, lightbox, and scroll-top listeners have no cleanup.
- Hero is the only effect with an explicit timeline kill callback.

These are low-risk under today's full document navigations, because unload destroys the page. They become high-risk if client-side view transitions, persistent layouts, or repeated initialization are added.

### Findings not present

- No animation of `top`, `left`, or `height` was found in production motion. The page wipe does animate width.
- No animated box shadow was found; the lightbox shadow is static.
- No `will-change` declarations were found, so there is no unnecessary permanent promotion hint.
- No duplicated IntersectionObservers or custom scroll listeners exist.
- No scroll hijacking, scrub loop, or custom smooth-scrolling RAF exists.

## 10. Reduced Motion / Accessibility

What is implemented well:

- `gsap.matchMedia()` prevents reveal and hero timelines from running when `prefers-reduced-motion: reduce` matches.
- The reduced branch explicitly restores reveal items to visible, untransformed content and fixes the hero to line 1.
- The page wipe checks the preference at click time and allows immediate normal navigation.
- CSS disables `hh-drift`, `hh-blink`, and `hh-spin`.
- Global image zoom is disabled.
- `/pics` disables image zoom/filter and lightbox opacity transitions.
- Scroll-to-top changes from smooth to instant scrolling and removes its translate motion.
- Rendered verification after more than four seconds showed no active document animations, all reveal content visible, and line 1 still static.

Gaps:

- Autoplay video continues in reduced-motion mode. All seven homepage videos remained playing in the rendered check.
- Contact field/tab/status transitions, Labs filter transitions, About CTA colors, header state transition, nav opacity fade, and lightbox control color transitions are not all disabled. Most are modest, but reduced motion is not fully centralized.
- The nav transform duration becomes zero, but its opacity can still transition for 200 ms.
- The scroll-top button still fades at 150 ms in reduced mode.
- CSS-only drift still runs if JavaScript fails but the visitor has not requested reduced motion.

Failure behavior:

- Reveal content is visible in authored markup/CSS before GSAP initializes, so content remains accessible if JavaScript fails. A possible side effect is flash-then-hide when GSAP initializes elements below the fold.
- Hero CSS provides a static first-line fallback through `data-step="0"`.
- The transition overlay starts at `display:none`, so it cannot block content if JavaScript fails.
- All Labs cards remain visible if filtering JavaScript fails.
- The contact form's current submit behavior is client-side simulation; this is a functional issue outside this motion audit, not an animation fallback.

## 11. Classification

| Animation | Location | Technique | Purpose | Rating A–E | Why |
|---|---|---|---|---|---|
| Single reveal | Homepage sections | GSAP + ScrollTrigger | Establish hierarchy | C — Rework | Reusable and subtle, but applied generically and only on one page family. |
| Group reveal | Homepage grids/lists | GSAP + ScrollTrigger | Reading order | B — Keep but standardize | Stagger communicates order; coverage and semantics need consistency. |
| Hero headline sequence | Homepage hero | GSAP timeline | Support hero message | B — Keep but standardize | Purposeful and verified, but dot/video semantics and fixed timing need alignment. |
| Hero dot color changes | Homepage hero | GSAP tween | Show headline state | B — Keep but standardize | Useful state cue, but looks like a carousel despite being non-interactive and media-static. |
| Nav underline | Global header | JS measurement + CSS transform | Navigation state/hover continuity | A — Keep | Purposeful, compositor-friendly, keyboard-aware, and reusable. Homepage state is incomplete. |
| Header scroll density | Global header | ScrollTrigger class + CSS color | Clarify sticky separation | B — Keep but standardize | Useful, but a dedicated ScrollTrigger and unused backdrop-filter transition are heavier than necessary. |
| Scroll-to-top reveal | Global Layout | ScrollTrigger class + CSS | Communicate availability of return action | A — Keep | Restrained and accessible; reduced variant exists. |
| Native smooth scroll to top | Global Layout | `window.scrollTo` | Spatial continuity | A — Keep | Local, purposeful, and reduced-motion aware. |
| Global image hover zoom | Global CSS | CSS transform | Add media feedback/personality | C — Rework | Applies to non-interactive media and does not consistently clarify clickability. |
| Photo grayscale/filter hover | `/pics` | CSS filter + transform | Reveal photo color/detail | B — Keep but standardize | Expressive and context-specific, though filter cost and duplicate zoom token should be reviewed. |
| Photo index fade | `/pics` | CSS opacity | Reveal metadata on interaction | A — Keep | Clear feedback with keyboard parity. |
| Lightbox open/close | `/pics` | CSS opacity | Clarify modal state | A — Keep | Purposeful, short, and reduced-motion aware. |
| Lightbox image replacement | `/pics` | CSS opacity + JS preload | Clarify content replacement | A — Keep | Small, meaningful transition with preload. |
| Lightbox control hover | `/pics` | CSS colors | Clarify interaction | B — Keep but standardize | Useful but part of fragmented timing tokens. |
| `hh-drift` | Hero/Labs/About/Contact videos | CSS infinite transform | Keep procedural media alive | C — Rework | Fits Labs best; universal/off-screen continuous use is costly and weakly purposeful elsewhere. |
| `hh-blink` | Status dots | CSS infinite opacity | Signal current availability/activity | B — Keep but standardize | Semantically understandable but endlessly attention-seeking across contexts. |
| `hh-spin` | Contact form | CSS infinite rotation | Communicate busy state | A — Keep | Conventional and purposeful while work is pending. |
| Contact input transitions | Contact forms | Tailwind CSS colors | Clarify hover/focus | A — Keep | Short and functional. |
| Contact tab transitions | Contact forms | Tailwind CSS colors | Clarify selected state | A — Keep | Purposeful; timing should join shared tokens. |
| Contact status fade | Contact forms | Tailwind CSS opacity | Clarify async state | A — Keep | Supports feedback without distraction. |
| Labs filter button transition | `/labs` | Tailwind `transition-all` | Clarify selected filter | B — Keep but standardize | Useful, but property scope is too broad. |
| Labs card filtering | `/labs` | Instant `display` toggle | Replace filtered content | C — Rework | Functional but has no spatial or content continuity. |
| Page-transition wipe | Global Layout | GSAP tween + layout writes | Mark route change | C — Rework | Strong concept and reduced fallback; outgoing-only, layout-triggering, and adds 520 ms before navigation. |
| Loader-spec RAF demo | `/loader-spec` | Custom RAF | Document/demo page wipe | E — Dead / unused for production | It is a separate public demo implementation, not the code real navigation uses. Retain only if the spec route is intentionally shipped. |
| Header/CTA/related-card instant hovers | Multiple pages | CSS state change, no transition | Interaction feedback | B — Keep but standardize | Feedback exists, but zero-duration behavior conflicts with similar transitioned controls. |
| Footer | Global footer | None | — | A — Keep static | No purposeful motion is currently missing merely because the footer is static. |

## 12. Current Motion System Diagram

```text
Layout.astro (every page)
│
├── initMotion() ───────────────────────────────────────────────┐
│   │                                                          │
│   ├── gsap.matchMedia(no-preference)                         │
│   │   ├── [data-reveal] → 14 homepage fade/rise triggers     │
│   │   ├── [data-reveal-group] → 8 homepage stagger triggers  │
│   │   └── homepage hero → one timed GSAP timeline             │
│   │                                                          │
│   ├── ScrollTrigger → header scrolled class                   │
│   ├── ScrollTrigger → scroll-top visible class                │
│   ├── nav geometry JS → CSS underline custom properties       │
│   ├── document link interception → GSAP outgoing page wipe    │
│   └── /pics listeners → CSS lightbox transitions              │
│                                                              │
├── global.css                                                 │
│   ├── hh-blink / hh-spin / hh-drift keyframes                │
│   ├── nav/header/scroll-top transitions                       │
│   └── global image hover zoom                                 │
│                                                              │
├── local Tailwind transitions                                 │
│   ├── Contact form                                            │
│   ├── Labs filter buttons                                     │
│   └── About photography CTA                                   │
│                                                              │
├── local scripts                                               │
│   ├── Labs cards → instant display toggle                     │
│   └── loader-spec → duplicate custom RAF demo                 │
│                                                              │
└── route/content transitions
    ├── Astro View Transitions: none
    ├── native View Transition API: none
    ├── incoming page motion: none
    └── outgoing GSAP wipe: present
```

## 13. Gaps

- **Navigation:** no initial entrance, no active homepage section tracking, no mobile menu, no mobile-specific state transition, no logo treatment, and auxiliary link states are instant.
- **Page entry:** no page-entry choreography. The custom wipe only covers the outgoing document.
- **Page transitions:** no Astro/native view transition, shared-element continuity, direction based on hierarchy, or case-study-specific navigation state.
- **Section transitions:** homepage sections independently fade up; there is no relationship or handoff between sections. Standalone pages are static.
- **Project image reveals:** no mask/clip or content-aware screenshot reveal. Images only fade/rise with their frames on the homepage and zoom on hover globally.
- **Work consistency:** dedicated Work/case-study pages do not use the homepage reveal vocabulary.
- **Labs filters:** selection color changes, but results pop in/out and reflow instantly. No result-count announcement or focus strategy is present.
- **Labs cards:** no deliberate hover or media state beyond always-running drift/autoplay.
- **Case-study navigation:** related cards only use an instant border hover plus the global outgoing wipe.
- **Hero media relationship:** progress dots track headline copy, not video state; media never changes.
- **Autoplay lifecycle:** no viewport pause/play, visibility-state handling, or reduced-motion playback fallback.
- **Duration/easing tokens:** only two GSAP easing constants exist; no shared duration scale or CSS/JS token bridge exists.
- **Mobile motion behavior:** reduced-motion rules exist, but there is no explicit low-power/mobile media strategy.

## 14. Questions / Decisions for Hammad

Only these decisions materially affect the later motion-system design:

1. Should the existing 520 ms branded wipe remain a defining navigation behavior, or is immediate navigation more important than an outgoing transition?
2. Should procedural videos remain autoplaying atmosphere outside Labs, or should autoplay/continuous drift be reserved for Hero and Labs with static posters elsewhere?
3. Is the hero intended to rotate copy only, or should each line correspond to a real media state? The current dots visually imply the latter but implement the former.
4. Should standalone listing/detail pages share the homepage's reveal vocabulary, or should homepage editorial sections and deep pages deliberately use different motion levels?
5. Is `/loader-spec` an intentional public portfolio route? It currently ships a duplicate, non-production RAF implementation of the wipe.
6. For homepage navigation, should active state follow the current scroll section, remain route-only, or intentionally stay absent?

No further design decisions are necessary before the existing system can be standardized diagnostically; specific new effects should be chosen only after these scope questions are answered.
