# Learning Progress

## ScrollTrigger fundamentals

**Introduced**
- trigger vs animated target distinction — they can be different elements
- scrub: ties timeline playhead directly to scroll position (without it, animations just fire)
- clip-path: inset() as a "window" into full-size content (vs scale which distorts children)
- pinning: CSS sticky (scene-stage pattern) gives scroll distance without GSAP pin
- from/to states as the core mental model: static design = one state; scroll = two states + distance between

**Demonstrated understanding**
- Correctly identified clip-path as the mechanism for the box reveal before being told
- Independently figured out 200svh for scroll distance and sticky pinning once the concept was explained
- Articulated the art/intent dimension: animation as communication, elements having "character"

**Developing concepts**
- Connecting clip-path inset values to the actual pixel area (which corner = which values)
- Timeline position arithmetic (stagger offsets within a scrubbed timeline)

## Contact section reveal (implemented)

**Confirmed design**
- Green corner box (clip-path: inset(72% 0% 0% 65%)) in bottom-right of viewport
- Expands to full screen (0→0.5 of timeline), halves split apart (0.5→1.0)
- Label "Scroll ↓" fades out, headline rises, CTAs fade in after split
- Section is 200svh, stage is CSS sticky (scene-stage pattern)

**Implemented**
- `ContactSection.astro`: added scene-stage wrapper + overlay div with two halves + label
- `global.css`: contact-scene height 200svh, overlay/half/label cinematic rules
- `contact.ts`: scrub-driven timeline replacing the old single-trigger animation
- 0 TypeScript errors
