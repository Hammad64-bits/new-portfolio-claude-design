# Hammad Portfolio — Working Decisions

_Last updated: 2026-09-06_

This file is the source of truth for decisions we explicitly lock in while planning the portfolio.
Anything still being explored is kept under **Current Draft / Not Locked** so we do not accidentally treat it as final.

---

## Locked Decisions

### 1. Core positioning

- Present Hammad as a **Software Engineer with a frontend edge**.
- Frontend is a major strength, but the portfolio should not reduce him to “the React guy”.
- The core story is: strong product sense, polished frontend execution, and a habit of following problems across the stack until they are solved.
- The site should be capable of attracting both:
  - strong frontend/software engineering roles
  - freelance/startup clients

### 2. What the portfolio should communicate

A visitor should come away thinking:

> “Guy is a cool, serious dev who can build stuff and understands how a product works.”

The portfolio should prove this through real work rather than generic skill claims.

### 3. Top-level information architecture

```text
/
├── Work
├── Labs
├── About
└── Contact
```

Supporting actions:

- CV → downloadable action
- GitHub → external link
- LinkedIn / Email → footer/contact
- About can initially live as a homepage section rather than requiring a separate page.

### 4. Homepage content hierarchy

```text
Hero
↓
Selected Work
↓
Capabilities
↓
Experience
↓
Labs / Experiments
↓
About / Personality
↓
Contact
↓
Footer / Socials
```

The homepage should show proof early rather than forcing visitors through a long biography first.

### 5. Work vs Labs

**Work = professional proof**

Examples:
- RevSmith
- SolvoLab / Vigilant Security
- Chat Widget
- Omnichannel Inbox
- WhatsApp Integration
- Analytics
- AI Agent Config
- SEO Migration
- Performance
- Security Incident

**Labs = technical curiosity / experimentation**

Examples:
- Linux
- AWS
- Networking
- Automation
- AI Agents
- Browser automation
- Trading bot
- other experiments

Photography belongs more to personality/About than technical Labs.

### 6. Skills

- Do **not** create a generic top-level “Skills” page.
- Skills should appear attached to evidence.
- Example:
  - “Omnichannel Inbox — Next.js · TypeScript · Supabase · Postgres”
- Technologies support the story; they are not the story.

### 7. Main work case studies

The two strongest professional stories are:

#### RevSmith
Primary themes:
- product engineering inside a small startup team
- embeddable support widget
- omnichannel inbox + human handoff
- AI agent configuration
- WhatsApp / Meta integration
- realtime systems
- analytics
- knowledge sources
- authentication
- Shopify/demo work
- frontend/data-access performance work

#### Vigilant / SolvoLab
Primary themes:
- inherited legacy WordPress systems
- production diagnosis
- SEO preservation and improvement
- performance work
- security incident response
- rebuilding the UK + IE sites on a modern framework
- modernising design without sacrificing search performance

### 8. Visual direction

Use the references for principles, not imitation:

- Maxime Heckel → visual experimentation / motion
- Brittany Chiang → information hierarchy / professional clarity
- Lee Robinson → writing clarity / engineering storytelling
- Paco → restraint

Overall feel:

- polished
- modern
- slightly experimental
- strong typography
- near-black / restrained professional surfaces
- bursts of strong colour in motion / experimental areas

### 9. Design rule

> **Professional information stays restrained. Experiments are allowed to misbehave.**

This keeps the site usable for recruiters while still showing personality and creative engineering taste.

### 10. Video / motion usage

- Do not let a giant autoplay visual overpower the hero.
- Text owns the hero; motion supports it.
- Abstract/procedural video is better used as:
  - hero accompaniment
  - transitions
  - Labs section visuals
  - experimental interludes between serious work sections

### 11. Hero structure

Keep these elements stable:

```text
Identity
↓
Animated positioning statement
↓
Permanent one-line explanation
↓
Primary CTA + CV
↓
Current role / status
```

The animated headline should:
- use a fixed-height area so layout does not jump
- transition like an editorial sequence, not an ad carousel
- move through roughly three statements
- stop on the final statement instead of looping forever

---


### 12. RevSmith case-study narrative priority

The RevSmith story should primarily present Hammad as:

> **C — Software Engineer:** started from a strong frontend base but increasingly worked across APIs, realtime systems, architecture, integrations, data access, authentication, and product-level engineering problems.

Secondary supporting narrative:

> **A — Product Builder:** helped build and evolve a real SaaS product inside a small startup team, including navigating a product pivot and shipping multiple major customer/support workflows.

This means the case study should not read like a gallery of UI screens. It should show how frontend ownership expanded into broader software/product engineering responsibility.



### 13. Claude Design handoff clarifications

These details are now explicit so the design brief cannot contradict itself:

- **Hero behavior:** use the 3-statement animated editorial sequence already defined. Do not replace it with the older static one-line hero sketch.
- **Copy voice:** concise, confident, technical, and human, with occasional dry/wry humor. Avoid corporate portfolio language and avoid forcing jokes into every section.
- **Current-status format:** use `Currently building at SolvoLab · Pakistan`.
- **Unrelated visual references:** do not treat the Blunor/video-production-template screenshot as a portfolio design reference. It is not part of the intended visual direction unless a specific technique from it is deliberately selected later.



### 14. Animation / scrolling paradigm

Locked recommendation:

- Keep **native browser scrolling** as the baseline.
- Use **GSAP** as the main animation orchestrator.
- Use **GSAP ScrollTrigger** only for meaningful scroll-linked sequences, reveals, pinning, and media transitions.
- Use **Lenis optionally** as a thin smooth-scroll layer if the native scroll feel needs polish. It should enhance scrolling, not turn the page into a scroll-hijacked experience.
- Do **not** adopt Locomotive Scroll for this portfolio by default.
- Use ordinary CSS transitions/animations for small hover, focus, button, underline, and micro-interaction states.
- Prefer transforms and opacity for frequent animation.
- Respect `prefers-reduced-motion`; experimental motion must degrade to a readable static experience.
- The guiding rule remains: **professional information stays restrained; experiments are allowed to misbehave.**

Motion hierarchy:

1. Micro-interactions — CSS
2. Time-based sequences (hero headline, intentional reveals) — GSAP
3. Scroll-linked storytelling — GSAP ScrollTrigger
4. Smooth scrolling — Lenis only if it materially improves the feel
5. Experimental video/procedural motion — isolated to hero support, transitions, and Labs


## Current Draft / Not Locked

### Hero identity

```text
Hammad Habib
SOFTWARE ENGINEER · FRONTEND EDGE
```

### Animated headline sequence

1. **Building products. Solving whatever breaks between idea and production.**
2. **I build software that has to actually work.**
3. **Polished interfaces, messy systems, production problems — I follow them wherever they lead.**

Current transition idea:
- hold each for ~4 seconds
- slide/fade upward
- stop after the third statement

### Supporting hero copy

> I’m Hammad, a software engineer with deep frontend experience. I work across product, architecture and systems to turn ideas into software people can actually use.

### Hero CTAs

- Explore my work →
- Download CV ↓

### Possible current-status line

- Currently building at SolvoLab · Pakistan

---

## Next Content Task

Develop **Selected Work**, beginning with **RevSmith**:
- project context
- problem
- Hammad’s ownership
- strongest features
- engineering decisions
- outcome / impact
- supporting product imagery
