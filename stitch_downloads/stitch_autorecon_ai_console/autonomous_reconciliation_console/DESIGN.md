---
name: Autonomous Reconciliation Console
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#a33200'
  on-tertiary: '#ffffff'
  tertiary-container: '#cc4204'
  on-tertiary-container: '#fff6f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832600'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: outfit
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: outfit
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: outfit
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-md:
    fontFamily: inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 15px
  mono-kpi:
    fontFamily: jetbrainsMono
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.02em
  mono-data:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  mono-sm:
    fontFamily: jetbrainsMono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 13px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-gutter: 1rem
  grid-margin: 1.5rem
  compact-row: 0.375rem
  panel-padding: 1rem
  section-gap: 1.5rem
  table-cell-x: 0.75rem
  table-cell-y: 0.5rem
---

## Brand & Style

This design system establishes an institutional-grade financial audit console engineered for high-throughput Indian e-commerce merchants reconciling gateway settlements (Razorpay, Juspay, Cashfree), ERP ledger states (TallyPrime, Zoho Books), and direct bank feeds (HDFC, ICICI, SBI).

The visual language rejects decorative SaaS fluff—omitting ambient pastel gradients, claymorphism, and low-density card sprawl. Instead, it embodies high-density structural precision, transactional transparency, and deterministic state tracking reminiscent of modern mission-critical banking terminals and Bloomberg consoles. 

Key attributes:
- **Zero-Tolerance Precision:** Crisp, hair-line visual dividers (1px solid borders) replacing drop shadows to prioritize data boundaries and maximize screen real estate.
- **Audit-First Hierarchy:** Explicit semantic differentiation separating verified states, warnings (MSME 45-day rule thresholds), and critical financial discrepancies (MDR overcharges, GST mismatch, missing UTR references).
- **Tabular Rigor:** Monospaced alignment for reference codes, transaction amounts, and ledger hashes, ensuring frictionless visual scanning and zero ambiguity.

## Colors

The color palette is built for clarity in transaction verification, high contrast, and rapid triaging of discrepancies.

### Core Swatches
- **Primary Accent (`#0066FF`):** Reserved strictly for primary action drivers (e.g., "Run Reconcile", "Push to TallyPrime"), active tab borders, and verified primary selections.
- **Secondary (`#0F172A` in light / `#FFFFFF` in dark):** Used for commanding headers, high-impact totals, and critical metric labels.
- **Neutral (`#64748B` in light / `#94A3B8` in dark):** Used for structural metadata, secondary timestamps, field captions, and inactive borders.

### Semantic Triage Roles
- **Matched / Verified (`#10B981`):** Indicates exact 1:1 ledger matches, cleared settlement batches, and verified UTR numbers.
- **Warning / At-Risk (`#F59E0B`):** Reserved for unmapped line items, pending gateway settlements, and approaching compliance deadlines (e.g., Section 43B(h) MSME limits).
- **Discrepancy / Breach (`#EF4444`):** Flags gateway fee overcharges, tax miscalculations, missing UTR credits, and duplicate payout attempts.

### Surface & Divider Hierarchy
- **Canvas Base:** `#F8FAFC` (Light) / `#0A0E17` (Dark)
- **Container / Panel Surface:** `#FFFFFF` (Light) / `#111827` (Dark)
- **Structural Border:** `#E2E8F0` (Light) / `#1E293B` (Dark)
- **Data Table Hover / Active Row:** `#F1F5F9` (Light) / `#1E293B80` (Dark)

## Typography

The type system separates quantitative audit intelligence, executive KPI rollups, and interactive control labels.

- **KPI Values & Core Headings (Outfit):** High-density geometric forms with weights 700 and 800 deliver commanding presence for net payout balances, dispute counts, and reconcilation health scores without visual crowding.
- **Body & Operational Microcopy (Inter):** Highly legible at reduced point sizes (11px–14px), used for contextual instructions, configuration forms, field descriptions, and ledger states.
- **Financial & Identity References (JetBrains Mono):** Mandated across all transactional entities: Indian Rupee (`₹`) values, 12-digit UTR identifiers, GSTINs, HSN codes, Razorpay payment IDs (`pay_*`), and XML/JSON Tally audit payload blocks. Numerals must render with tabular sizing so vertical totals align.

## Layout & Spacing

The layout is built for maximum screen efficiency, supporting simultaneous multi-column audits, split-pane comparison views (Gateway Settlement vs. Bank Statement vs. ERP Voucher), and collapsible navigation sidebars.

### Desktop (Audit Console View, >= 1280px)
- **Grid Structure:** 12-column fluid grid or direct multi-pane layout with 16px (`1rem`) gutters and 24px (`1.5rem`) outer frame margins.
- **High-Density Table System:** Standard row heights clamped to 36px–40px with `0.5rem` vertical cell padding and `0.75rem` horizontal cell padding to allow scanning of 25+ rows viewport without scrolling.
- **Split-Pane View:** Fixed 400px side inspection tray for deep UTR analysis, XML payload inspection, and manual matching overrides.

### Tablet (Horizontal Data Triage, 768px - 1279px)
- Fluid collapse into 8-column layout. Split panels convert to pull-out bottom sheets or tabbed master-detail screens. Row padding increases to `0.625rem` for touch targets.

### Mobile (PWA Approvals & Alert Feed, <= 767px)
- Single-column flow with persistent top-anchored critical reconciliation summary and bottom-anchored approval bar. 
- Wide data tables switch to horizontally scrollable sticky-column cards, displaying the matched state and net settlement amount on the pinned left side.

## Elevation & Depth

This design system avoids soft, decorative drop shadows. Depth and hierarchy are achieved entirely through **hair-line borders, surface contrast, and crisp active states**.

- **Level 0 (App Shell & Canvas):** Base background tint (`#F8FAFC` light / `#0A0E17` dark) establishing the outer framework.
- **Level 1 (Data Cards, Inspection Panels, Tables):** Solid surface (`#FFFFFF` light / `#111827` dark) enclosed by a 1px solid border (`#E2E8F0` light / `#1E293B` dark). No blur shadows.
- **Level 2 (Dropdowns, Filter Flyouts, Context Menus):** Pure background container with a 1px border (`#CBD5E1` light / `#334155` dark) paired with a high-precision, low-blur utility shadow: `0px 4px 12px rgba(15, 23, 42, 0.08)` in light mode and `0px 4px 16px rgba(0, 0, 0, 0.45)` in dark mode.
- **Level 3 (Inspection Modals & Critical Overrides):** Centered surfaces overlaid on a semi-opaque backdrop (`rgba(15, 23, 42, 0.6)`). Outlined with an accent-tinted border (`#0066FF` at 20% opacity or `#1E293B`) to delineate the active modal boundaries.

## Shapes

The design system maintains a structured, institutional geometric profile with **Soft (Level 1)** rounding. 

- **Data Tables, Ledger Panels, and Top-Level Containers:** 4px (`0.25rem`) border radius. Sharp enough to echo Bloomberg-style institutional tools while avoiding harsh visual corners.
- **Buttons, Text Inputs, and Filter Chips:** 4px (`0.25rem`) corner radius. Maintains strict grid alignment across dense control bars.
- **Status Tags & Semantic Badges:** 2px to 4px maximum. Pill or high-radius shapes are prohibited except for round avatar markers or binary indicator dots (6px × 6px circles).

## Components

### Buttons
- **Primary CTA:** Solid `#0066FF` background, `#FFFFFF` text, 4px border radius. Padding: 6px 14px for default density (32px total height). Font: Inter Medium 13px. Hover: `#0052CC`. Focus: 2px offset ring `#0066FF`.
- **Secondary / Ghost:** Transparent background, 1px solid `#E2E8F0` (light) / `#1E293B` (dark). Text: `#0F172A` (light) / `#FFFFFF` (dark). Hover: `#F1F5F9` (light) / `#1E293B` (dark).
- **Destructive / Dispute Action:** 1px solid `#EF4444` outline or muted `#FEE2E2` (light) / `#450A0A` (dark) tint with `#DC2626` text.

### Chips & Semantic Status Badges
- Compact height (20px to 22px). Padding: 2px 6px. Font: JetBrains Mono 10px uppercase, bold.
- **Matched Batch:** `#ECFDF5` background, `#065F46` text, 1px solid `#A7F3D0` (Light). Dark: `#064E3B` surface, `#6EE7B7` text, `#047857` border.
- **Discrepancy / Overcharge:** `#FEF2F2` background, `#991B1B` text, 1px solid `#FECACA` (Light). Dark: `#450A0A` surface, `#FCA5A5` text, `#7F1D1D` border.
- **Pending / At-Risk:** `#FFFBEB` background, `#92400E` text, 1px solid `#FDE68A` (Light). Dark: `#451A03` surface, `#FCD34D` text, `#78350F` border.

### Data Grid & Reconciliation Tables
- Monospaced numerical values, order IDs, UTR numbers, and GSTIN cells. All currency columns right-aligned with fixed tabular spacing.
- Sticky header row with `#F8FAFC` (light) / `#0B0F19` (dark) background and bottom 1px divider.
- Hover feedback: Row-level highlighting via `#F8FAFC` to isolate line items during manual auditing.

### Form Inputs & Filters
- Compact height: 32px standard, 36px large.
- Background: `#FFFFFF` (light) / `#0F172A` (dark), 1px solid border `#CBD5E1` (light) / `#334155` (dark).
- Focus state: Border transitions to `#0066FF`, zero external fuzzy glow.
- Monospace mode: Applied to search inputs that take UTR, order ID, or GST reference numbers.

### Transaction Detail / Inspection Card
- Enclosed panel with 1px border.
- Internal headers include timestamp, batch sync ID, and status tag aligned horizontally.
- Key-value breakdown configured as a two-column definition list: left column neutral label (Inter 11px), right column monospace value (JetBrains Mono 12px).