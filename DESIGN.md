# SAM — Design System
## Ciphergon · sam.ciphergon.xyz

---

## Visual DNA

Two references — internalize both, synthesize into SAM:

**Netflix**
- Near-black backgrounds (#141414), not pure black
- Content is the hero — UI recedes behind it
- Bold, confident typography — no decoration needed
- Red is singular and purposeful
- Scroll = discovery. Every scroll reveals something new.
- Cards are immersive, full-bleed, hover-activated

**finalbosu.com**
- Ultra-refined motion — nothing generic
- Cursor-aware interactions — the UI responds to presence
- Generous whitespace that feels intentional, not empty
- Typography as architecture — text placement IS the layout
- Dark sophistication, not dark-because-everyone-does-it

**SAM's synthesis:**
> Cinematic financial intelligence. The UI should feel like a command center for your money — serious, precise, alive.

---

## Color Palette

```
--bg-void:       #0D0D0D    primary background (near-black, not pure)
--bg-surface:    #141414    cards, panels (Netflix-level dark)
--bg-elevated:   #1C1C1C    hover states, modals
--accent-red:    #E50914    primary CTA, critical alerts (Netflix red)
--accent-dim:    #B81D24    secondary red, borders
--text-primary:  #FFFFFF    headlines
--text-secondary:#A3A3A3    body, labels
--text-muted:    #525252    placeholders, metadata
--border:        rgba(255,255,255,0.06)
--success:       #16A34A
--warning:       #D97706
--border-accent: rgba(229,9,20,0.3)   red glow borders
```

---

## Typography

**Display:** `Neue Haas Grotesk Display` or `Clash Display` (Google Fonts fallback: `Syne`)
- Used for: hero headlines, section statements, numbers
- Weight: 600–800
- Letter spacing: -0.02em to -0.04em (tight — premium feel)

**Body:** `Inter` — wait. No. Use `DM Mono` for data/financial figures, `Geist` for UI body copy.
- Financial figures (amounts, percentages, dates): DM Mono — mono spacing = precision
- UI labels, descriptions: Geist
- Uppercase labels: letter-spacing 0.12em, font-size 11px

---

## Landing Page Architecture

### Section 1 — Hero (100vh)
**Emotional target:** Instant authority. User feels SAM already knows something they don't.

Background: `#0D0D0D` with a subtle, slow-moving particle field (not loud — almost imperceptible).

Center: Large bold headline, not centered — left-aligned at 60% viewport width.
```
HEADLINE: "Your subscriptions
           are bleeding you."
```
Syne/Clash Display, 96–120px, white, tight tracking.

Below: Single line in DM Mono, muted — `$2,847 lost to forgotten subscriptions last year. On average.`

CTA: One button. Sharp rectangle. Red background. White text. `[ Connect & Find Out ]`
Not two buttons. One decisive action.

Right side (40% viewport): Live animated "subscription radar" — a dark card showing 3–4 detected subscription entries appearing one by one, with confidence scores ticking up. Feels like SAM is already working.

Scroll indicator: thin red line animating downward, bottom center.

---

### Section 2 — The Problem (scroll-triggered)
**Layout:** Full-width, text-dominant. No icons. No cards.

Large number on the left: `$273` — in DM Mono, massive (200px+), red, partially cropped at viewport edge.
Right side: `"The average person pays for 12 subscriptions. Remembers 8."`

As user scrolls — the number counts up to `$273`. The text fades in word by word.

Below: Three single-line statements, appearing on scroll, staggered:
- `Netflix you haven't opened in 4 months. $15.99/mo.`
- `Figma Pro, even though you use the free tier. $15/mo.`
- `That productivity app from 2023. $8/mo.`
Each line: strikethrough animation on the price. Red underline reveals.

---

### Section 3 — How SAM Works
**Layout:** Horizontal scroll section (pinned) — 4 steps revealed as user scrolls.

Pin the section. Steps slide in from right:

Step 1: `CONNECT` — Gmail + wallet. 30 seconds. No manual entry.
Step 2: `DETECT` — SAM scans. Every subscription surfaced.
Step 3: `ANALYZE` — Confidence scoring. Usage signals. Pattern recognition.
Step 4: `ACT` — Remind, pause, or cancel. You approve. SAM executes.

Each step: dark card, red left-border, step number in large muted DM Mono behind it.

---

### Section 4 — Intelligence Preview
**Layout:** macOS-style browser mockup of the SAM dashboard, centered, large.

Animate on scroll: mockup rises from below with a subtle shadow. Hover: slight 3D tilt (perspective transform, mouse-tracked).

Inside the mockup: show the subscription list with confidence scores. Feels real. Feels like a product screenshot, not an illustration.

---

### Section 5 — The Trust Section
**Layout:** Full-width dark panel. Left: headline. Right: 3 trust pillars stacked.

Headline (large, left): `"SAM acts when you say so."`

Right stack:
- `Read-only Gmail access. SAM cannot send or delete.`
- `Every action requires your approval in Phase 1.`
- `All execution is logged, auditable, and reversible.`

Each line: appears on scroll with a check-reveal animation (line draws in from left).

---

### Section 6 — CTA Finale
**Layout:** Full-viewport. Center. Breathing room.

Large headline: `"Stop losing money to silence."`
Below: `sam.ciphergon.xyz — Early Access`
Button: Large. Red. `[ Get Early Access ]`

Background: subtle animated red radial glow behind the text — breathes (scale pulse, very slow).

---

## Component Rules

### Buttons
- Shape: Sharp rectangle. Never pill. Never rounded > 4px.
- Primary: `bg-accent-red`, white text. On hover: brightness 110%, subtle scale 1.02.
- Secondary: transparent, `border: 1px solid rgba(255,255,255,0.15)`. Hover: border goes red.
- NO gradients on buttons.

### Cards
- Background: `#141414`
- Border: `rgba(255,255,255,0.06)` default. Hover: `rgba(229,9,20,0.3)` (red glow)
- On hover: translate Y -4px, box-shadow intensifies. Feels magnetic.
- No rounded corners > 8px.

### Confidence Score Component
- Large number in DM Mono (64px+), white
- Below: thin progress bar, fills red to the confidence %
- Below: signal list — 3 bullets in small muted Geist

### Subscription Row
- Left: merchant logo (or red initial avatar if missing)
- Center: merchant name (Geist, white) + billing cadence (DM Mono, muted)
- Right: amount in DM Mono + confidence badge
- Hover: entire row lifts, red left-border appears, quick-action buttons fade in

---

## Animation Library

All via **Framer Motion**.

```tsx
// Standard scroll reveal
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
}

// Stagger children
const stagger = {
  visible: { transition: { staggerChildren: 0.12 } }
}

// Number count-up — use react-countup triggered by useInView

// Horizontal pinned scroll — use GSAP ScrollTrigger for Section 3
// (Framer Motion alone struggles with pinned horizontal scroll)

// 3D tilt on hover — track mouse position, apply rotateX/rotateY via useMotionValue
```

---

## What SAM Is NOT Allowed to Look Like
- Fintech startup template (blue/white, rounded cards, shield icon)
- Crypto dashboard (dark purple, gradient text, "Web3" everywhere)
- Generic SaaS (Inter font, hero gradient blob, feature icon grid)
- Robinhood/Revolut clone
- Anything with a hero illustration

---

## Mood in One Line
> A ruthless, intelligent system that happens to have taste.
