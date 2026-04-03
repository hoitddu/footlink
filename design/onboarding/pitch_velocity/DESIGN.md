# Design System Document: Professional Futsal & Tech-Forward Interface

## 1. Overview & Creative North Star

### Creative North Star: "The Kinetic Arena"
This design system is built to bridge the gap between the raw, tactile energy of a futsal court and the precision of modern sports technology. We are moving away from the "standard app" aesthetic by embracing **The Kinetic Arena**—a philosophy where the UI feels like a premium sporting environment. This is achieved through high-contrast typography, expansive white space that mimics an open pitch, and layered surfaces that provide a sense of elite physical depth.

To break the "template" look, we prioritize:
- **Intentional Asymmetry:** Using off-center focal points and varied spacing to create a sense of movement.
- **Editorial Scale:** Dramatic shifts between massive display type and refined, functional body text.
- **Tonal Depth:** Replacing harsh lines with sophisticated, overlapping glass containers that allow the "Pitch Green" energy to bleed through the interface.

---

## 2. Colors

The palette is anchored by the deep, resonant **Pitch Green** (`primary: #061b0e`) and the crisp, high-velocity **Electric White** (`surface_container_lowest: #ffffff`).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. Boundary definition must be achieved exclusively through:
1. **Background Color Shifts:** Placing a `surface_container_low` (#f2f4f3) card against a `surface` (#f8faf9) background.
2. **Subtle Tonal Transitions:** Using the surface hierarchy to naturally "lift" content.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials.
- **Base Layer:** `surface` (#f8faf9) for main page backgrounds.
- **Secondary Layer:** `surface_container` (#eceeed) for grouping related content blocks.
- **Interactive Layer:** `surface_container_highest` (#e1e3e2) or `surface_container_lowest` (#ffffff) for the most prominent actionable cards.

### The "Glass & Gradient" Rule
To achieve a "Tech-Forward" feel, use **Glassmorphism** for floating headers, navigation bars, and overlays. Use `surface_variant` (#e1e3e2) at 60-80% opacity with a `backdrop-blur` of 20px-40px. 

**Signature Texture:** For primary CTAs and Hero sections, apply a subtle linear gradient transitioning from `primary` (#061b0e) to `primary_container` (#1b3022) at a 135-degree angle. This mimics the light reflecting off high-quality turf.

---

## 3. Typography

The typography strategy pairs the aggressive, geometric nature of **Space Grotesk** with the functional, humanistic clarity of **Manrope**.

*   **Display & Headlines (Space Grotesk):** These are our "stadium banners." Use `display-lg` (3.5rem) and `headline-lg` (2rem) for high-impact screens. The tight kerning and bold weights convey authority and speed.
*   **Titles & Body (Manrope):** These are our "technical specs." `title-md` (1.125rem) handles sub-headers, while `body-md` (0.875rem) provides maximum legibility for match details and player stats.
*   **Hierarchy Note:** Use `tertiary_fixed_variant` (#005313) for small labels to inject a "sporty tech" accent without overwhelming the clean 'Electric White' aesthetic.

---

## 4. Elevation & Depth

We move beyond Material Design's standard shadows to create a more bespoke, atmospheric depth.

### The Layering Principle
Depth is achieved by "stacking" tones. A `surface_container_lowest` card placed on a `surface_container_low` section creates a natural, soft lift that feels integrated into the app’s architecture.

### Ambient Shadows
When a floating effect is required (e.g., a "Join Match" button), use **Ambient Shadows**:
- **Color:** A tinted version of `on_surface` (#191c1c) at 6% opacity.
- **Blur:** Large values (20px to 40px) to simulate natural, soft lighting rather than a digital drop shadow.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a **Ghost Border**: `outline_variant` (#c3c8c1) at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons (The "Pitch" Action)
- **Primary:** Gradient from `primary` to `primary_container`. Roundedness: `lg` (1rem). High-contrast `on_primary` text.
- **Secondary:** Glassmorphic `surface_variant` at 40% opacity with a `backdrop-blur`.
- **States:** On hover/press, increase the `surface_tint` (#4d6453) overlay by 10%.

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines.
- **Structure:** Separate list items using `spacing-3` (1rem) and subtle background shifts between `surface_container_low` and `surface_container`.
- **Imagery:** Cards should often feature "abstract grass textures" or high-action sports photography as a full-bleed background with a `primary` overlay at 40% to ensure text legibility.

### Selection Chips
- **Style:** Use `rounded-full` (9999px).
- **Active:** `primary_container` background with `on_primary_container` text.
- **Inactive:** `surface_container_high` background.

### Custom Component: The Match Timer/Progress
- **Visuals:** Use a thin, high-contrast bar using `tertiary_fixed` (#94f990) against a `primary` background to indicate "Match Time" or "Slots Remaining."

---

## 6. Do's and Don'ts

### Do:
- **Use Large Margins:** Use `spacing-16` (5.5rem) for top-level page padding to maintain the "Spacious & Minimalist" vibe.
- **Layer Glass over Imagery:** When placing text over sports photography, use a glassmorphic container to maintain "Tech-Forward" readability.
- **Embrace Roundedness:** Stick strictly to the `12px/1rem` (lg) scale for a friendly but modern feel.

### Don't:
- **Don't use standard Grey:** Use the `secondary` and `surface_variant` tokens which are slightly tinted green/blue to maintain the "Pitch" atmosphere.
- **Don't use 1px Dividers:** Content should be separated by space (`spacing-8`) or tonal changes.
- **Don't overcrowd:** If a screen feels busy, increase the spacing scale by one increment (e.g., move from `4` to `5`).

---

**Director's Final Note:**
Remember, we are designing an *experience*, not a utility. Every screen should feel as intentional and high-performance as a professional futsal pitch. Use the "Pitch Green" sparingly but with high impact, and let the "Electric White" provide the breathing room required for a premium tech product.