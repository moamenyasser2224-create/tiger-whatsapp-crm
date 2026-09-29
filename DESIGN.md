# Quiet Professionalism (احترافية هادئة) — Design System Specification

## 1. Design Principle
A serene, confident, and highly refined design system engineered for an established financial and management advisory firm. It emphasizes generous white space, calm contrast, a single disciplined accent hue, and immaculate typography. All previous experimental metaphors (office stationery, ledger stamps, perforation edges, and neo-brutalist solid drop shadows) are fully decommissioned.

---

## 2. Color Tokens (Design Tokens)

### Light Mode (`:root`)
- **Background (`bg`)**: `#f6f6f4`
- **Card / Surface (`card`)**: `#ffffff`
- **Text (`text`)**: `#1c1c1e`
- **Muted Text (`muted`)**: `#6b6b6f`
- **Border (`border`)**: `#e5e4e1`
- **Accent (`accent`)**: `#15503f` (Deep Forest Green)
- **Accent Hover (`accent-hover`)**: `#0f3d30`
- **Accent Soft (`accent-soft`)**: `#e8efec`
- **Danger (`danger`)**: `#8a3b32` (Subdued Terra Cotta)
- **Danger Soft (`danger-soft`)**: `#f5eae8`

### Dark Mode (`.dark`)
- **Background (`bg`)**: `#121212`
- **Card / Surface (`card`)**: `#1b1b1b`
- **Text (`text`)**: `#f0f0ee`
- **Muted Text (`muted`)**: `#9d9d9d`
- **Border (`border`)**: `#2d2d2c`
- **Accent (`accent`)**: `#4fae8e`
- **Accent Hover (`accent-hover`)**: `#6bc2a4`
- **Accent Soft (`accent-soft`)**: `#1b2925`
- **Danger (`danger`)**: `#c98a80`
- **Danger Soft (`danger-soft`)**: `#2a1e1c`

> **Strict Rule**: Exactly ONE primary accent color exists in the entire system. Rainbow state colors (blues, purples, yellows, oranges) are strictly prohibited. State variance is communicated purely through `muted`, `accent`, and `danger`.

---

## 3. Typography & Numerics
- **Universal Font**: **IBM Plex Sans Arabic** (weights 400, 500, 600, 700) with fallback `system-ui, -apple-system, sans-serif`.
- **Numerics & Financial Figures**: Always rendered with `tabular-nums` (`font-variant-numeric: tabular-nums`).
- **Emoji Policy**: **STRICTLY ZERO EMOJIS ANYWHERE IN THE UI.** All actions and headers are purely typographic.
- **Iconography**: Clean, uniform Lucide icons with consistent thin stroke weight (`strokeWidth={1.5}` or `1.75`), strictly matching text/accent color.

---

## 4. Components

### Sidebar Navigation
- **Surface**: `bg-card` with `border-r border-border`.
- **Active Navigation Item**: `bg-accent-soft`, start-side indicator border `border-s-2 border-accent`, `text-accent font-semibold`.
- **Inactive Navigation Item**: `text-muted font-normal`, hover `hover:bg-bg hover:text-text`.

### Cards & Table Containers
- **Surface**: `bg-card` with `border border-border`.
- **Border Radius**: 10px–12px (`rounded-xl`).
- **Shadow**: Ultra-subtle `0 1px 2px rgba(0,0,0,0.03)` (`shadow-subtle`). No heavy or colored drop shadows.

### Buttons
- **Primary**: Filled `bg-accent text-white hover:bg-accent-hover font-medium rounded-lg px-4 py-2 transition-colors`.
- **Secondary**: `bg-card border border-border text-text hover:bg-bg font-medium rounded-lg px-4 py-2 transition-colors`.
- **Low-Impact (Ghost)**: `text-muted hover:text-text hover:bg-bg/50 rounded-lg px-3 py-1.5 transition-colors`.
- **Danger**: `text-danger border border-danger hover:bg-danger-soft font-medium rounded-lg px-3 py-1.5 transition-colors`. Never glaring solid red.

### Status Badges (Uniform Pill)
- Neutral uniform container: `bg-card border border-border rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1.5`.
- Inner 7px status dot:
  - `bg-muted` for In-Progress states ("New", "Contacted").
  - `bg-accent` for Positive states ("Interested", "Closed Won", "Approved", "On Time").
  - `bg-danger` for Negative states ("Lost", "Not Interested", "Disputed", "Late").

### Form Fields & Inputs
- `bg-card border border-border rounded-lg px-3 py-2 text-text`.
- On focus: `focus:border-accent focus:outline-none focus:ring-0`. No glow or spread rings.

### Chat Stream
- **Outbound (Self)**: Filled `bg-accent text-white rounded-xl rounded-tr-sm p-3.5`.
- **Inbound (Other)**: Subdued `bg-bg border border-border text-text rounded-xl rounded-tl-sm p-3.5`.

### Layout & Spacing
- Fixed sidebar with structured top header.
- Main content container capped at `max-w-7xl mx-auto w-full` with comfortable padding.
- Headings set to `font-semibold text-xl` to `text-2xl` with calm hierarchy.

---

## 5. Explicit Prohibitions
- No color gradients.
- No backdrop blur / glassmorphism.
- No multi-colored badge rainbows.
- No solid black offset drop shadows (`shadow-solid`).
- No sharp zero-radius corners (`rounded-none`).
- No rubber stamps, ruled paper backgrounds, or perforated cut edges.
