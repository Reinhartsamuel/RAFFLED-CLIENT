# Raffled — Design System for AI-Powered UI Generation

> **Style: "Dark Tech"** — Deep black backgrounds, amber/gold accents, monospace body text, glassmorphism panels, terminal-inspired details, Web3 dashboard aesthetics.

---

## 1. Brand Colors (Tailwind v4 tokens)

| Token | Hex | Usage |
|---|---|---|
| `bg-primary` / `pure-black` | `#050505` | Page backgrounds, body |
| `bg-secondary` / `charcoal` | `#0a0a0a` | Card surfaces, sections |
| `bg-elevated` | `#111111` | Elevated panels, hover states |
| `bg-surface` / `grey` | `#1a1a1a` | Input backgrounds, subtle surfaces |
| `border-default` | `#1f1f1f` | Default borders |
| `border-hover` | `#2a2a2a` | Hovered borders |
| `accent` / `gold` / `safety-lime` | `#FFB800` | Primary brand color, CTAs, active states |
| `accent-hover` | `#FFCC33` | Accent hover |
| `accent-secondary` / `cyan-accent` | `#FF6B00` | Secondary accent, gradients |
| `success` | `#22C55E` | Success, green dot, confirmed |
| `error` | `#EF4444` | Error, failures |
| `warning` | `#F59E0B` | Warning |
| `text-primary` | `#F5F5F5` | Primary text |
| `text-secondary` | `#999999` | Secondary/muted text |
| `text-tertiary` | `#555555` | Placeholder, disabled |
| `text-inverse` | `#050505` | Text on accent backgrounds |

### Gradient Text
```css
.text-gradient-amber {
  background: linear-gradient(135deg, #FF6B00, #FFB800, #F5F5F5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 2. Typography

| Token | Font Stack |
|---|---|
| `font-sans` | `'Geist', system-ui, sans-serif` |
| `font-mono` | `'Geist Mono', 'Geist MonoVariable', monospace` |

- **Body text**: Geist Mono (monospace) — deliberate terminal/developer feel
- **Headings**: Geist Sans (bold weights 600-800)
- **Labels/UI**: `font-mono text-[10px] uppercase tracking-widest` — tiny mono uppercase for meta labels
- **Weights used**: 400, 500, 600, 700, 800

---

## 3. Shadows

| Token | Value |
|---|---|
| `shadow-card` | `0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)` |
| `shadow-elevated` | `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)` |
| `shadow-glow-amber` | `0 0 20px rgba(255,184,0,0.15), 0 0 60px rgba(255,184,0,0.05)` |
| `shadow-glow-amber-lg` | `0 0 40px rgba(255,184,0,0.25)` |
| `shadow-glow-success` | `0 0 20px rgba(34,197,94,0.2)` |

---

## 4. Border Radius

| Token | Value | Tailwind |
|---|---|---|
| `radius-sm` | 6px | `rounded-sm` |
| `radius-md` | 8px | `rounded-md` |
| `radius-lg` | 12px | `rounded-lg` |
| `radius-xl` | 16px | `rounded-xl` |
| — | 20px | `rounded-2xl` |

---

## 5. Spacing & Layout Conventions

| Context | Pattern |
|---|---|
| Section padding | `py-24 md:py-32` |
| Container max-width | `max-w-6xl` or `max-w-7xl` |
| Card internal padding | `p-5` or `p-7` |
| Card internal gaps | `gap-3` or `gap-4` |
| Grid gaps | `gap-4` |
| Standard grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4` |
| Button padding (sm) | `px-4 py-2` |
| Button padding (md) | `px-5 py-2.5` |
| Button padding (lg) | `px-8 py-3.5` |

---

## 6. CSS Utilities (from `globals.css`)

```css
/* Glass panel */
.glass-panel {
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* CRT scanline overlay */
.scanline::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* Shimmer for progress bars */
.animate-shimmer {
  animation: shimmer 2s infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

## 7. Framer Motion Variants (from `utils/animations.ts`)

```typescript
// Ease curve used everywhere:
ease: [0.25, 0.46, 0.45, 0.94]  // custom cubic-bezier

// Page transitions
pageVariants:     opacity 0→1, y 8→0, 0.4s

// Staggered lists
staggerContainer: staggerChildren 0.07, delayChildren 0.1
staggerItem:      opacity 0→1, y 20→0, 0.5s

// General fade-in-up
fadeInUp:         opacity 0→1, y 20→0, 0.5s

// Modal/card entrance
scaleIn:          opacity 0→1, scale 0.95→1, 0.3s
modalVariants:    opacity 0→1, scale 0.95→1, y 10→0, 0.3s
overlayVariants:  opacity 0→1, 0.2s

// Slide from right
slideInRight:     opacity 0→1, x 20→0, 0.4s

// Glow pulse (CTAs)
glowPulse:        boxShadow cycles 0→20px→40px→20px rgba(255,184,0,xx), 2s infinite

// Hover/tap
cardHover:        y -4 on hover
buttonVariants:   scale 1.02 hover, 0.97 tap, 0.15s
```

---

## 8. Key Animation Classes (from `tailwind.config.js`)

```js
'animate-fade-in':   'fadeIn 0.5s ease-out'
'animate-slide-up':  'slideUp 0.5s ease-out'
'animate-glow-pulse':'glowPulse 2s ease-in-out infinite'
```

---

## 9. Scrollbar Styling

```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: #050505; }
::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #FFB800; }
```

---

## 10. Component Reference — UI Patterns

### Cards (primary container pattern)
- **Background**: `bg-[#0a0a0a]` or `.glass-panel`
- **Border**: `border border-[#1f1f1f]` or `border border-white/[0.06]`
- **Border radius**: `rounded-lg` (12px) or `rounded-xl` (16px)
- **Shadow**: `shadow-card` or `shadow-elevated`
- **Hover**: `hover:-translate-y-1` + `hover:shadow-glow-amber`
- **Inner padding**: `p-5` or `p-7`
- **Optional**: mouse-tracking radial spotlight overlay via CSS custom properties

### Buttons
- **Primary**: `bg-accent text-text-inverse font-mono font-bold uppercase tracking-wider rounded-md px-5 py-2.5` + glow shadow
- **Secondary**: `border border-[#1f1f1f] text-text-primary font-mono font-bold uppercase tracking-wider rounded-md px-5 py-2.5 hover:bg-[#111]`
- **Ghost** (landing-2): transparent bg, white text, hover:bg-white/5
- **Framer Motion**: `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}`

### Form Inputs
- **Background**: `bg-[#111]` or `bg-[#1a1a1a]`
- **Border**: `border border-[#1f1f1f] focus:border-accent`
- **Text**: `text-text-primary font-mono`
- **Placeholder**: `placeholder:text-text-tertiary`
- **Padding**: `px-4 py-3`
- **Radius**: `rounded-lg`

### Modals
- **Overlay**: fixed inset-0, `bg-black/80`, `backdrop-blur-sm`
- **Content**: `bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-7 max-w-lg w-full`
- **Entry**: Framer Motion `modalVariants` (scale + fade)

### Labels / Metadata
- `font-mono text-[10px] uppercase tracking-widest text-text-secondary`

### Status Indicators
- **Live/Active**: green dot (`w-2 h-2 rounded-full bg-success`) with pulse animation
- **Countdown**: mono font, amber or white color
- **Progress bar**: `h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden`, inner bar `bg-accent` with shimmer overlay

### Skeleton Loading
- `bg-[#1a1a1a] rounded-lg animate-pulse`

### Grid Background Pattern (optional)
- SVG pattern with `stroke="rgba(255,184,0,0.04)"` or CSS `background-image` with radial-masked repeating grid
- Used as card overlay or section background

### Navbar
- `sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-[#1f1f1f]`

### Dashboard Sidebar
- `w-64 bg-[#0a0a0a] border-r border-[#1f1f1f]`
- Active filter: `border-l-2 border-accent bg-accent/5 text-accent`

---

## 11. Design Vibe Guide for AI

- **Mood**: Dark, premium, terminal-meets-financial-dashboard
- **References**: DeFi dashboards (like dYdX, Synthetix), terminal UIs (warp, iterm2), brutalist web design
- **Avoid**: Gradients on surfaces (use flat dark colors), rounded corners > 20px, bright white backgrounds, colorful multi-brand palettes
- **Texture**: Subtle grid patterns at 4% opacity, thin 1px borders, amber glow on interactive elements
- **Motion**: Smooth, snappy, purposeful — no gratuitous animation
- **Typography voice**: Technical, precise, uppercase labels, monospace for data-heavy content
- **Layout density**: Generous padding (cards: p-5/p-7), clear visual hierarchy, lots of negative space

---

## 12. Tailwind Usage Conventions

Use direct hex values in `bg-[#...]` / `text-[#...]` syntax OR the custom tokens above. Both patterns exist in the codebase. For new components, prefer the custom tokens:

```tsx
// Preferred
<div className="bg-bg-secondary border border-border-default rounded-lg p-5">
  <p className="text-text-secondary font-mono">label</p>
</div>

// Also acceptable (both exist in codebase)
<div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-5">
  <p className="text-[#999] font-mono">label</p>
</div>
```

---

## 13. Page Layout Pattern

```
┌─────────────────────────────────────┐
│  Navbar (sticky, backdrop-blur)     │
├──────────┬──────────────────────────┤
│ Sidebar  │  Main Content            │
│ (w-64)   │  (flex-1, p-6 md:p-8)   │
│ bg-[#0a] │  bg-[#050505]            │
│ border-r │                          │
│          │  ┌────────────────────┐  │
│          │  │  Card Grid         │  │
│          │  │  gap-4             │  │
│          │  └────────────────────┘  │
├──────────┴──────────────────────────┤
│  Footer (minimal, border-t)        │
└─────────────────────────────────────┘
```

---

## 14. How To Use This File

When generating UI components with AI design tools (v0, Claude Artifacts, Cursor, Bolt.new, etc.), use this prompt template:

```
You are generating a React component for a "Raffled" dApp. The app uses:
- React + TypeScript + Tailwind CSS v4
- Framer Motion for animations
- The "Dark Tech" design system defined below:

[Paste the relevant sections from DESIGN.md above]

The component I need is: [describe component, functionality, and data needs]

Generate a complete, production-ready component with all states (loading, empty, error, success).
```
