# Project Map

## Purpose
Personal portfolio site for Hammad. Showcases work case studies, side-project labs, photography, about, and contact pages.

## Requirements
Not specified. Derived from code: animate sections on scroll, smooth scrolling, responsive layout.

## Components
- `src/layouts/Layout.astro` — base HTML shell, loads global styles and scripts
- `src/pages/index.astro` — home page, composes section components
- `src/pages/about.astro`, `work.astro`, `labs.astro`, `contact.astro`, `pics.astro` — other top-level pages
- `src/pages/work/` — case study pages (revsmith, vigilant-security)
- `src/pages/labs/` — individual lab pages (airswipe, courtpal, figure-sentry, git-to-cv, waqas-work-bot)
- `src/components/` — Hero, Work, Labs, Capabilities, Experience, AboutSection, ContactSection, ContactForm, Footer, Header
- `src/scripts/home.ts` — entry point for homepage JS, coordinates scenes
- `src/scripts/motion.ts` — animation utilities
- `src/scripts/smooth.ts` — Lenis smooth scroll setup
- `src/scripts/scenes/` — per-section GSAP scroll animation scenes (hero, work, labs, capabilities, experience, about, contact, core)
- `src/styles/global.css` — global styles (Tailwind v4)

## Main Flow
Browser loads page → Layout.astro renders HTML → smooth.ts inits Lenis → home.ts registers GSAP scroll scenes → user scrolls → scene callbacks trigger element animations

## Data and Trust Boundaries
No backend. No auth. Static site. Contact form destination: unknown (not yet inspected).

## Build and Deployment
`astro dev` (dev), `astro build` (prod), `astro preview` (preview built output). Node >=22.12.0 required.

## Unknowns
- Contact form submission target/handler
- Deployment host
- Current state of gsap-test branch changes vs main
