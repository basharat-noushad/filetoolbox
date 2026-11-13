---
name: PDF and Image +
description: Free, private, browser-based PDF and image tools — two color-coded lanes, one calm workshop.
colors:
  ink-indigo: "#4f46e5"
  ink-indigo-deep: "#1e1b4b"
  ink-indigo-soft: "#6366f1"
  ink-indigo-hero-accent: "#a5b4fc"
  signal-emerald: "#059669"
  signal-emerald-soft: "#10b981"
  neutral-canvas: "#f5f3ff"
  neutral-surface: "#ffffff"
  neutral-ink: "#111827"
  neutral-body: "#4b5563"
  neutral-muted: "#6b7280"
  neutral-border: "#e5e7eb"
  neutral-border-tinted: "#e0e7ff"
  destructive: "#dc2626"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "7px"
  md: "10px"
  lg: "12px"
  xl: "17px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink-indigo}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "#4338ca"
  tool-tile-pdf:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  tool-tile-image:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  badge-pill:
    backgroundColor: "#ecfdf5"
    textColor: "{colors.signal-emerald}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

# Design System: PDF and Image +

## Overview

**Creative North Star: "The Two-Lane Workshop"**

PDF and Image + is a calm, trustworthy utility, not a flashy product — the design has to earn the trust of someone about to drop a contract or ID scan into a browser tab. Every surface is flat: white or near-white panels sit on a faint indigo-tinted canvas, separated by hairline borders and tonal rings rather than drop shadows. The one deliberate piece of theater is a two-lane color system — indigo for every PDF tool, emerald for every image tool — carried from the homepage grid down to the logomark itself (two small rectangles, indigo and emerald, side by side). Nothing else competes for saturation: a deep indigo-900 hero and a couple of emerald checkmarks are the only concentrated color in an otherwise white, quiet interface.

The voice is efficient and unpretentious: bold, tight headlines state the job to be done ("Merge PDF"), body copy stays short and literal, and trust signals (no sign-up, no watermark, no upload) are repeated as plain badges rather than marketing copy. Nothing here should read as decorative — every color, radius, and piece of motion answers "which lane am I in" or "did that click work."

**Key Characteristics:**
- Two-lane color coding: indigo = PDF, emerald = Image, applied consistently to icons, tile borders, hover glow, and badges.
- Flat surfaces by default; elevation only appears as a tinted glow on hover, never as ambient shadow at rest.
- One saturated dark section (indigo-900 hero / CTA band) bookending otherwise white, quiet pages.
- Generous, consistent corner rounding (17px tiles, 12px buttons, full pills) — no sharp corners anywhere.
- Plus Jakarta Sans throughout; no secondary display face.

## Colors

The palette is two accents on a near-monochrome base: warm-neutral surfaces, one indigo lane, one emerald lane, each used with restraint.

### Primary
- **Ink Indigo** (`#4f46e5`): the PDF lane and the site's primary action color — CTA buttons, header announcement bar, PDF-category icons and tile borders, links.
- **Ink Indigo Deep** (`#1e1b4b`): the one saturated dark surface — hero section, bottom CTA band, body text tint (`--foreground`). Used sparingly, as a bookend, not a background.
- **Ink Indigo Soft** (`#6366f1`): hover/active tint and the shadcn `--primary` token; also the lighter half of the hero headline ("Free, Fast & Private").
- **Ink Indigo Hero Accent** (`#a5b4fc`, `brand-300`): secondary text on the dark indigo-900 hero and CTA bands (badge label, subhead, CTA subtext) — needs to sit between `brand-400` and `brand-200` in contrast against a dark background.

### Secondary
- **Signal Emerald** (`#059669`): the Image lane, mirroring Ink Indigo's role one-for-one — Image-category icons, tile borders, hover glow — plus every trust checkmark badge site-wide ("No registration required," etc.), which is why it also reads as the app's "success/confirmed" color.
- **Signal Emerald Soft** (`#10b981`): the small pulsing dot in the hero's "50+ Free Tools" pill; secondary emphasis within emerald contexts.

### Neutral
- **Neutral Canvas** (`#f5f3ff`): page background (`--background`) — a barely-tinted indigo white, never pure white.
- **Neutral Surface** (`#ffffff`): every card, tile, header bar, and FAQ panel — pure white, floating on the tinted canvas.
- **Neutral Ink** (`#111827`, Tailwind `gray-900`): headings and primary body text on white surfaces.
- **Neutral Body** (`#4b5563`, `gray-600`): paragraph and description text.
- **Neutral Muted** (`#6b7280`, `gray-500`): secondary/meta text (counts, captions, timestamps).
- **Neutral Border** (`#e5e7eb`, `gray-200`) and **Neutral Border Tinted** (`#e0e7ff`, `brand-100`): hairline dividers and card borders; the tinted variant appears specifically around indigo-lane surfaces (header, PDF tiles), plain gray around neutral chrome.

### Named Rules
**The One Lane Rule.** A component is either in the indigo lane or the emerald lane, never both. If it represents a PDF tool or PDF-category content, every accent on it — icon, border, hover glow, badge — is indigo. Image-category content gets the emerald equivalent, token-for-token. Don't mix lanes within one component to imply "extra emphasis."

**The Flat Canvas Rule.** Only two surface colors exist in normal use: `neutral-canvas` behind everything, `neutral-surface` (white) for every actual content panel. Don't introduce a third background tone or a gradient panel; depth comes from the hover-glow and border system in Elevation, not from additional fills.

## Typography

**Display/Body Font:** Plus Jakarta Sans (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Label/Mono Font:** Geist Mono is loaded as `--font-mono` but not visibly used in any current UI; treat as reserved, not active.

**Character:** One geometric, slightly rounded sans-serif carries the entire system — confident and legible at hero scale, still calm and businesslike at body size. There is no serif or secondary display face; hierarchy comes entirely from size and weight, not from font-pairing contrast.

### Hierarchy
- **Display** (700, `clamp(2.25rem, 5vw, 3.75rem)`, 1.1 line-height, −0.02em tracking): hero `<h1>` only. Two lines max, second line often mixes white and Ink Indigo Soft.
- **Headline** (700, 1.25rem, 1.3 line-height): section titles ("PDF Tools", "How to Merge PDF", "Frequently Asked Questions").
- **Title** (600, 0.875rem, 1.4 line-height): tool-tile names, card titles, FAQ questions.
- **Body** (400, 1rem–1.125rem, 1.6 line-height, `text-gray-600`): descriptions, FAQ answers, about-page copy. Reads comfortably up to full container width; no explicit measure constraint observed, so keep prose blocks inside the existing `max-w-3xl`/`max-w-6xl` containers rather than letting it run edge to edge.
- **Label** (500, 0.75rem–0.875rem, 1.4 line-height): badges, meta captions, nav links, footer text.

### Named Rules
**The One Voice Rule.** Every weight jump is Plus Jakarta Sans at a different size/weight, never a different family. A second typeface anywhere in this system is a regression, not an enhancement.

## Layout

Content sits inside one of two fixed containers: `max-w-6xl` for tool/blog/content pages, `max-w-7xl` for the header/nav bar. Both are centered with `px-4` gutters and no intermediate breakpoint container — the same max-width holds from tablet up to desktop.

Section rhythm is large and consistent: hero and CTA bands run `py-20`–`py-28`; standard content sections run `py-12`–`py-16`; component-internal spacing (tile padding, card gaps) stays in the 12–16px range. The result is a small number of very generous vertical breaks between big blocks, and tight, uniform spacing inside them — not a continuous gradient of spacing values.

Grids are responsive by column count, not by container query: tool tiles run `grid-cols-2` (mobile) → `sm:grid-cols-3` → `lg:grid-cols-5`; trust-bar and value-prop grids run `grid-cols-2` → `md:grid-cols-4`. The sidebar ad rail (`w-[300px]`) appears only at `lg` and above and is hidden entirely below that, so the reading column is full-width on mobile and tablet.

## Elevation & Depth

The system is flat at rest — no ambient box-shadows on cards, tiles, or panels in their default state. Depth is conveyed two ways instead: a **1px tonal border or ring** (`ring-foreground/10`, or `border-brand-100`/`border-emerald-100`) that separates a white surface from the tinted canvas, and a **colored glow shadow that appears only on hover** (`hover:shadow-md hover:shadow-brand-500/10` or the emerald equivalent) as direct feedback that a tile is interactive.

### Shadow Vocabulary
- **Lane hover glow** (`box-shadow: var(--tw-shadow-md)` tinted at 10% opacity in the lane's accent color): the only shadow in the system. Appears on tool tiles on hover, paired with a border-color shift to the lane's 400-value.

### Named Rules
**The Hover-Only Shadow Rule.** No element ships a resting shadow. If something needs to look elevated at rest, give it a tonal border or ring, not a shadow — shadows are reserved as a hover/interaction signal, and using one at rest would blunt that signal everywhere else.

## Shapes

Corners are soft and consistently sized by role, never sharp: buttons and form-style controls use a 12px radius (`rounded-lg`), tool tiles/cards/FAQ panels use a larger ~17px radius (`rounded-xl`), and small chip-like elements (announcement pill, badges, the trust-badge row) are fully rounded (`rounded-full`). The homepage bottom CTA band uses a bigger `rounded-2xl` block radius as its one intentionally larger shape. Borders are always 1px hairlines; there is no double-border or outlined-plus-shadow combination anywhere.

## Components

### Buttons
- **Shape:** 12px radius (`rounded-lg`); pill-shaped only for the icon-size variants' smaller radius steps.
- **Primary:** Ink Indigo (`#4f46e5` / `bg-brand-600`) fill, white text. The `lg` size (used for every primary task-completing action — Merge, Download, Convert, etc.) is `h-11` (44px) to meet the mobile touch-target minimum; `default`/`sm`/`icon-*` stay compact for secondary/dense UI.
- **Hover / Focus:** background steps one shade deeper (`#4338ca` / `brand-700`); focus state gets a 3px ring at 50% opacity of `--ring` (Ink Indigo Soft). Active press nudges the button 1px down (`translate-y-px`), not a scale change.
- **Secondary / Outline / Ghost:** outline uses a bordered, background-matched button that fills with `muted` on hover; ghost has no border and only a `muted` hover fill; both keep the same 12px radius and sizing scale as primary.

### Cards / Tool Tiles
- **Corner Style:** 17px (`rounded-xl`).
- **Background:** white on the tinted canvas.
- **Shadow Strategy:** none at rest; lane-tinted glow on hover (see Elevation).
- **Border:** 1px, lane-tinted (`border-brand-100` for PDF content, `border-emerald-100` for Image content) or neutral `ring-foreground/10` for lane-agnostic cards; shifts to the lane's 400-value on hover.
- **Internal Padding:** 16px (`p-4`), icon badge centered above a single-line title.

### Chips / Badges
- **Style:** pill-shaped, tinted-background + tinted-text pairing (e.g. `bg-emerald-50 text-emerald-700 border-emerald-200` for trust badges), always paired with a small leading icon (checkmark or status dot).
- **State:** static/informational only — no selected/unselected toggle state observed in current components.

### Inputs / Fields (file dropzone)
- **Style:** large dashed-border drop target (not a solid-border text input), generous padding, centered icon + label + helper text. Icon is lane-tinted (indigo for PDF tools, emerald for image tools) per the One Lane Rule.
- **Focus / Active drag state:** border and background shift to the lane's tint on hover and on drag-over — indigo for PDF-accepting dropzones, emerald for image-accepting ones.
- **Privacy note:** an optional line under the helper text reassures the user their file isn't uploaded, shown only on tools where that claim is actually true (client-side-only tools) — never a blanket claim, since a handful of conversions proxy to a server per PRODUCT.md.

### Navigation
- Two-tier header: a slim Ink Indigo announcement bar (`bg-brand-600`, white text, 32px tall) sits above a white main nav bar with a 1px bottom border. Logo is literally the two-lane device (indigo + emerald rectangles) next to the wordmark. Desktop shows a mega-menu; below `lg` it collapses to a hamburger-triggered `MobileNav`. Primary nav CTA is a solid Ink Indigo button ("All Tools"); nav links are plain label-weight text with a color shift on hover, no underline until link-style text elsewhere.

## Do's and Don'ts

### Do:
- **Do** assign every PDF-related element Ink Indigo and every Image-related element Signal Emerald, token-for-token, per the One Lane Rule.
- **Do** keep new panels flat with a tonal border at rest; add the lane-tinted glow shadow only as a hover/interactive response.
- **Do** use Plus Jakarta Sans at every weight; rely on size/weight/color for hierarchy, not a second typeface.
- **Do** keep the indigo-900 dark surface rare and bookend-only (hero, final CTA) so it stays a landmark, not wallpaper.
- **Do** round every new UI element to one of the established steps (12px controls, 17px panels, full pills) — never an arbitrary radius.

### Don't:
- **Don't** add a resting box-shadow to a card, tile, or button; shadows exist only on hover in this system.
- **Don't** blend indigo and emerald accents on the same component to signal "more important" — introduce a third named color instead if a genuinely new category is needed, and confirm it with the user first.
- **Don't** introduce a third background fill between `neutral-canvas` and white `neutral-surface`, and don't use a gradient panel anywhere — the calm, flat-canvas feel is load-bearing for a tool that asks people to trust it with private files.
- **Don't** add a watermark, paywall visual, or artificial-scarcity pattern to any tool output or CTA — this is a confirmed product/brand commitment, not just a visual preference.
