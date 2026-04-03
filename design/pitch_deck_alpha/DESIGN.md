# Design System Strategy: The Kinetic Court

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Court"**

This design system moves away from the static, "grid-locked" feel of traditional sports apps. Instead, it adopts a **High-End Editorial** aesthetic that mirrors the fluidity, speed, and precision of futsal. We treat the screen as a dynamic court where elements aren't just placed—they are positioned with intent.

To break the "template" look, we utilize **intentional asymmetry** and **tonal depth**. Large, architectural typography (Manrope) overlaps with subtle glass containers, creating a sense of 3D space. We favor "breathing room" (generous whitespace) over information density, ensuring that the user’s focus is pulled immediately to high-stakes actions like "Join Match" or "Instant Book."

---

## 2. Colors & Atmospheric Depth
Our palette is anchored in the deep, authoritative **Primary (#00342b)**, evoking the professional atmosphere of high-end indoor arenas.

### Surface Hierarchy & The "No-Line" Rule
To maintain a premium feel, **1px solid borders are strictly prohibited** for sectioning. Structural boundaries must be defined through background shifts or tonal transitions.
*   **Base:** Use `surface` (#f4faff) for the global background.
*   **Sectioning:** Use `surface_container_low` (#e7f6ff) to define broad content areas.
*   **Elevation:** Place cards using `surface_container_lowest` (#ffffff) to create a natural, "lifted" feel against the slightly darker background.

### The Glass & Gradient Rule
For floating elements—such as bottom navigation bars or "Quick Join" drawers—apply **Glassmorphism**. Use `surface_variant` (#d4e5ef) at 70% opacity with a 20px backdrop blur. 
*   **Signature Polish:** Apply a subtle linear gradient to Primary CTAs, transitioning from `primary` (#00342b) to `primary_container` (#004d40) at a 135-degree angle. This adds "soul" and prevents the UI from feeling flat.

### Status Indicators (High-Contrast)
*   **Immediate Availability:** Use `error` (#ba1a1a) for maximum urgency.
*   **Starting Soon:** Use `tertiary_container` (#742e00) for a sophisticated amber alert.
*   **Team Match:** Use `secondary` (#546067) for a professional, neutral tone.

---

## 3. Typography: The Editorial Voice
We utilize a dual-font system to balance "Elite Sport" with "Functional Tech."

*   **Display & Headlines (Manrope):** This is our architectural voice. Use `display-lg` and `headline-lg` for hero stats or match titles. Don't be afraid to use `tight` letter-spacing (-0.02em) for a high-fashion, editorial look.
*   **Body & Labels (Plus Jakarta Sans):** This is our functional voice. It provides high legibility for match details, player counts, and navigation. 
*   **Visual Hierarchy:** Use `on_surface_variant` (#3f4945) for secondary metadata to create a clear "read-order" that prioritizes the match time and location.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are a fallback, not a standard. We achieve depth through the **Layering Principle**.

*   **Tonal Stacking:** An `inverse_surface` (#23333a) element should be used for dark-mode-style "Power Cards" to disrupt the light layout and signal a premium "Featured Match."
*   **Ambient Shadows:** Where a shadow is required (e.g., a floating Action Button), use a blur of `24px` with a 6% opacity of `on_background` (#0d1e25). It should feel like a soft glow of light, not a "drop" shadow.
*   **The Ghost Border Fallback:** If a container requires more definition on a complex background, use a `1px` stroke of `outline_variant` (#bfc9c4) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons (Immediate Action)
*   **Primary:** High-contrast `primary` (#00342b) fill with `on_primary` (#ffffff) text. Radius: `lg` (1rem). 
*   **Secondary:** `secondary_container` (#d7e4ec) fill. Used for "Invite Friends" or "View Map."
*   **Bottom CTA:** Fixed position, full-width with `16` (4rem) horizontal padding, utilizing the "Glassmorphism" rule for the container background.

### Match Cards & Lists
*   **Rule:** Forbid divider lines. 
*   **Structure:** Use `spacing-6` (1.5rem) to separate match entries. 
*   **Badges:** Use `tertiary` (#511e00) backgrounds for "Starting Soon" badges to create high-impact "pop" against the cool-toned surface.

### Inputs & Selection
*   **Input Fields:** Use `surface_container_high` (#d9ebf5) for the field background with no border. On focus, transition the background to `surface_container_highest` (#d4e5ef).
*   **Chips:** Use `primary_fixed` (#afefdd) for selected states to provide a "fresh" sporting green highlight.

### Signature Component: The "Match-Pulse" Card
A card that uses `surface_container_lowest` (#ffffff) with an asymmetric layout. The match time is oversized (Manrope, `headline-lg`), while the "Join" button is tucked into the bottom right using a `primary` (#00342b) fill, breaking the standard centered alignment.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use overlapping elements (e.g., a player’s profile photo overlapping the edge of a card) to create a sense of movement.
*   **Do** use the `20` (5rem) and `24` (6rem) spacing tokens for vertical section breathing room.
*   **Do** use `plusJakartaSans` for all micro-copy to ensure readability at `label-sm` sizes.

### Don’t
*   **Don’t** use pure black (#000000). Always use `on_background` (#0d1e25) for high-contrast text.
*   **Don’t** use `0.5rem` (default) radius for match cards; always use `lg` (1rem) or `xl` (1.5rem) to maintain the "lifestyle" softness.
*   **Don’t** stack more than three levels of surface hierarchy. If you need more depth, use a Glassmorphism blur instead of another background color.