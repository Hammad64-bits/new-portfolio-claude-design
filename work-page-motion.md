# Work page motion change

## Requested behavior

- On cinematic desktop layouts, scrolling should move sideways from the hero to `01 — RevSmith`, then to `02 — Vigilant Security / SolvoLab`.
- Let VSS arrive fully before beginning the final green reveal, and reserve the last part of the sequence for that reveal.
- Keep the VSS content entering from the right as the horizontal sequence advances.
- Start the final green reveal at the bottom-left and expand it across the VSS panel.
- Slow wheel input enough to make scroll-linked scenes readable. Keep compact layouts and reduced-motion behavior readable without horizontal pinning.

## Implementation record

- `src/pages/work.astro`: the cinematic desktop sequence pins the hero, RevSmith, and VSS panels together. Scroll progress is split into three stages: hero to RevSmith, RevSmith to fully visible VSS, then a stationary VSS panel while the green box expands from bottom-left through the end. Project media is sized to fit the pinned viewport.
- `src/scripts/smooth.ts` and `src/scripts/motion.ts`: Lenis now runs sitewide with lower wheel sensitivity and a slower interpolation rate. Reduced-motion users remain on native scrolling. Locomotive was not added because its transformed scrolling would conflict with this site's sticky stages.
- `src/scripts/home.ts`: removed the previous homepage-only Lenis startup to prevent creating a second instance.
- `src/scripts/cursor.ts`: the shared cursor now checks the control directly under the pointer and refreshes its proximity targets while tracking, so links added after startup are included.
- `src/pages/work.astro`: the work hero now cycles through four short statements, with the first held as the reduced-motion fallback.
- `src/layouts/Layout.astro`, `src/styles/global.css`, and `src/scripts/motion.ts`: replaced the centered Hammad split wipe with a lime loading card. Its sequence is green reveal, black/white corner strokes drawing on, a letter-by-letter elastic “Loading.” wave, then the black and white underline strokes one after another.
- `src/pages/loader-spec.astro`: replaced the prior split-wipe spec with a visual reference for the new loading card.
- Verification: `git diff --check` passed. No build or browser check run.

## Cursor follow-up

- The cursor element and script are in the shared layout, with no route-specific guard. The old script captured a one-time target list and used only distance-to-element checks; the update prioritizes the control under the pointer and scans the live document target set during cursor movement. The snapshot was a real weakness for dynamically added links, though source inspection alone does not prove it explains every static route symptom.
- Verification: source-level review and `git diff --check`; no browser interaction check run.
