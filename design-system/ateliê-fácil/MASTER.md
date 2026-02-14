# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Ateliê Fácil
**Generated:** 2026-02-12 13:44:35
**Category:** Luxury/Premium Brand

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#EC4899` | `--color-primary` |
| Secondary | `#F472B6` | `--color-secondary` |
| CTA/Accent | `#06B6D4` | `--color-cta` |
| Background | `#FDF2F8` | `--color-background` |
| Text | `#831843` | `--color-text` |

**Color Notes:** Bold primaries + artistic freedom

### Typography

- **Heading Font:** Plus Jakarta Sans
- **Body Font:** Outfit
- **Artisan Touch:** Playfair Display (Serif) or subtle script for accents only.
- **Mood:** Clean, balanced, artisan-premium, breathable.
- **Google Fonts:** [Plus Jakarta Sans + Outfit](https://fonts.google.com/share?selection.family=Plus+Jakarta+Sans:wght@400;700;800|Outfit:wght@400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&family=Outfit:wght@400;500;600;700&display=swap');
```

### Spacing & Proportions (Refined)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tiny gaps |
| `--space-sm` | `8px` | Small gaps |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Large padding (cards) |
| `--space-xl` | `32px` | Section gaps |
| `--radius` | `1.25rem`| Soft organic corners |

### Shadow Depths (Crisp)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.03)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.05)` | Regular cards |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.08)` | Featured items |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #06B6D4;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #EC4899;
  border: 2px solid #EC4899;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FDF2F8;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #EC4899;
  outline: none;
  box-shadow: 0 0 0 3px #EC489920;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Liquid Glass

**Keywords:** Flowing glass, morphing, smooth transitions, fluid effects, translucent, animated blur, iridescent, chromatic aberration

**Best For:** Premium SaaS, high-end e-commerce, creative platforms, branding experiences, luxury portfolios

**Key Effects:** Morphing elements (SVG/CSS), fluid animations (400-600ms curves), dynamic blur (backdrop-filter), color transitions

### Page Pattern

**Pattern Name:** Storytelling + Feature-Rich

- **CTA Placement:** Above fold
- **Section Order:** Hero > Features > CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Cheap visuals
- ❌ Fast animations

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
