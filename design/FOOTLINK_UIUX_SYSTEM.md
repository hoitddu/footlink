# FootLink UI/UX System

## 1. Product Thesis

FootLink is not a scheduling utility. It is a high-energy participation engine for weekend football players who want one thing fast: get into a game with the least possible friction.

Design principle:
- Connect. Play. Repeat.
- Show the next action before showing more information.
- Make commitment feel easy and immediate.
- Keep the product premium, sporty, and masculine without becoming visually noisy.

Creative direction:
- Sporty minimalism
- Premium turf energy
- Strong contrast
- Light glassmorphism, not frosted overload
- Card-first mobile UI

North star:
- Nike Run Club for motivational energy
- Tinder for low-friction swipe-level decision speed
- Airbnb for trust, clarity, and structured detail presentation

## 2. Benchmark Synthesis

### Nike Run Club
- Use bold hero typography and strong motivational framing.
- Use performance-colored accents sparingly so CTA moments feel charged.
- Show progress and status visually, not with dense copy.

### Tinder
- Reduce decision time on the home feed.
- Make primary actions obvious in under one second.
- Encourage repeat action loops through fresh nearby inventory and immediate feedback.

### Airbnb
- Keep cards calm, legible, and trust-building.
- Structure detail pages with clean information sections and clear primary actions.
- Use polished spacing and hierarchy so users never feel lost.

## 3. Design System Foundations

### Brand Mood

FootLink should feel like:
- premium indoor pitch
- pre-match anticipation
- fast coordination among players
- modern consumer sports app, not admin software

### Color Palette

Core tokens:

| Token | HEX | Use |
|---|---|---|
| `bg.base` | `#F6F8F6` | Main app background |
| `bg.elevated` | `#FFFFFF` | Cards, sheets, focused containers |
| `bg.soft` | `#EEF2EE` | Secondary surfaces, chips, filters |
| `text.primary` | `#0C140F` | Primary text |
| `text.secondary` | `#5F6A63` | Metadata and helper text |
| `text.inverse` | `#F8FAF8` | Text on dark surfaces |
| `brand.primary` | `#112317` | Main CTA and premium dark surfaces |
| `brand.primary-strong` | `#06150C` | Pressed/immersive dark states |
| `accent.lime` | `#B8FF5A` | High-energy highlight, confirmation, pulse bars |
| `accent.blue` | `#4DA3FF` | Map, distance, secondary emphasis |
| `status.urgent` | `#FF5E57` | Starting soon / scarce slot urgency |
| `status.warning` | `#FFB546` | Time-sensitive but not critical |
| `status.success` | `#39D98A` | Joined, confirmed, success states |

Rules:
- No purple gradients.
- No raw black; use `#0C140F`.
- Keep lime accent under 10% of the visible screen area.
- Use glass only for floating navigation, overlays, and sticky CTA trays.

### Dark Mode

Dark mode tokens:
- `bg.base.dark` `#08100B`
- `bg.elevated.dark` `#101A13`
- `bg.soft.dark` `#16221A`
- `text.primary.dark` `#F3F6F3`
- `text.secondary.dark` `#A7B3AB`
- `brand.primary.dark` `#B8FF5A`

Dark mode rule:
- Dark mode must feel like a floodlit night match, not inverted grayscale.

## 4. Typography System

Recommended pairing:
- Headline: `Space Grotesk`
- Body/UI: `Manrope`

Type scale:

| Role | Size | Weight | Use |
|---|---|---|---|
| `display-xl` | `48/52` | `700` | Landing slogan |
| `display-lg` | `40/44` | `700` | Hero numbers, big headings |
| `headline-lg` | `32/36` | `700` | Screen titles |
| `headline-md` | `24/30` | `700` | Section titles |
| `title-lg` | `20/26` | `700` | Card titles |
| `title-md` | `18/24` | `600` | Match detail subheads |
| `body-lg` | `16/24` | `500` | Primary readable body |
| `body-md` | `14/22` | `500` | Secondary text |
| `label-lg` | `14/18` | `700` | CTAs |
| `label-sm` | `12/16` | `700` | Chips, metadata |

Typography rules:
- Tight tracking only for display and headlines.
- No body text below 14px on mobile.
- Use tabular figures for time, player counts, and prices.

## 5. Mobile Spacing System

Spacing scale:
- `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

Layout rules:
- Horizontal gutter: `20px`
- Sticky bottom CTA safe inset: `24px + safe-area`
- Card radius: `20px`
- Button radius: `16px`
- Chip radius: `999px`
- Touch targets: minimum `48x48`

Use hierarchy by spacing:
- within card: `12-16`
- between stacked cards: `16`
- between major sections: `24-32`
- hero to primary CTA: `32-40`

## 6. Motion and Feedback

Motion tokens:
- tap press: `120ms`
- chip select: `160ms`
- card entrance: `220ms`
- page transition: `280ms`
- easing: `cubic-bezier(0.22, 1, 0.36, 1)`

Micro-interactions:
- Join CTA compresses to `0.98` on press and emits a lime glow ring.
- Match cards stagger in with `30ms` intervals.
- Remaining slot bar animates from left to right on page load.
- Floating create button expands label on scroll stop.
- Successful join triggers haptic-like visual pulse plus inline confirmation.

Reduced motion:
- Disable stagger and replace with fade-only transitions.

## 7. Screen System

## Screen 1. Landing / Intro

### Layout Structure
- Full-screen hero image or cinematic futsal texture
- Top: small FootLink wordmark
- Center: large slogan and one supporting line
- Bottom: single primary CTA

### Content
- Headline: `Connect. Play. Repeat.`
- Subcopy: `근처 경기, 빠른 참여, 가벼운 시작.`
- CTA: `Start`

### Components
- hero background
- brand mark
- slogan block
- primary CTA

### UX Reasoning
- One decision only: enter.
- The visual should create anticipation before cognitive effort begins.
- Removing secondary actions keeps onboarding momentum high.

## Screen 2. Minimal Onboarding

Structure:
- Step 1: location permission
- Step 2: skill level
- Step 3: preferred play time

Each step must be single-focus with one primary CTA.

### Step 1: Location
- Title: `내 주변 경기부터 볼게요`
- Short rationale line
- Primary CTA: `위치 허용`
- Secondary text link: `나중에 할게요`

### Step 2: Skill
- Select chips: `입문`, `초중급`, `중급`, `상급`
- Primary CTA: `다음`

### Step 3: Preferred Time
- Large chips: `오늘 저녁`, `평일 밤`, `토 오전`, `일 오전`
- Optional multi-select
- Primary CTA: `매치 보기`

### UX Reasoning
- Permission first because nearby relevance is the product promise.
- Skill level improves match quality without feeling like account setup.
- Time preference helps show good first results, increasing first-session conversion.

## Screen 3. Home Screen

### Layout Structure
- Sticky top summary bar
- Short greeting or utility header
- Quick filters row
- Nearby matches list
- Floating CTA for create

### Top Bar
- Left: current area
- Center: date/time context
- Right: quick filter or notification icon

### Quick Filters
- `지금`
- `오늘 저녁`
- `가까운 순`
- `내 수준`

### Match Card Structure
- Top-left: kickoff time
- Top-right: urgency/status badge
- Middle: ground name and area
- Secondary row: skill, fee, distance
- Bottom: remaining slots visualization + primary CTA

### Primary CTA
- Card CTA: `Join Match`
- Floating CTA: `Create Match`

### UX Reasoning
- Home must answer “Can I join now?” in one scroll.
- Time and scarcity lead the card, not admin metadata.
- Floating create CTA supports power users without stealing focus from joining.

## Screen 4. Match Detail

### Layout Structure
- Hero card with time and venue
- Slot progress section
- Match essentials
- Host trust section
- Fixed bottom join CTA

### Content Blocks
- Hero: time, title, area, urgency badge
- Slots: `남은 자리 2/10`
- Essentials: skill, fee, game type, address, parking, notes
- Host: nickname, response speed, recent hosted count

### Visualized Remaining Slots
- Use horizontal segmented bar with filled lime segments
- Add label: `거의 마감`

### Primary CTA
- `Join Match`

Secondary:
- `오픈채팅`
- `지도 보기`

### UX Reasoning
- The user needs confidence, not complexity.
- Slot visibility converts indecision into action.
- Trust block reduces drop-off before join.

## Screen 5. Create Match Flow

### Flow Principle
- Maximum 3 steps
- Each step can be completed with one thumb
- Always show progress

### Step 1: Basics
- Match type
- Date
- Time
- Location
- CTA: `다음`

### Step 2: Roster
- Needed players
- Skill level
- Fee
- Join method
- CTA: `다음`

### Step 3: Publish
- Preview card
- Edit shortcuts
- CTA: `매치 올리기`

### UX Reasoning
- Creation must feel lighter than sending a long message in chat.
- Users should preview commitment before publishing.
- Three steps is the upper limit before drop-off starts to rise.

## 8. Component Breakdown

Core components:
- `AppShell`
- `TopBar`
- `StickyFilterRail`
- `MatchCard`
- `UrgencyBadge`
- `SlotProgress`
- `PrimaryButton`
- `SecondaryGlassButton`
- `FilterChip`
- `BottomActionTray`
- `PermissionCard`
- `SelectionChipGroup`
- `StepProgress`
- `HostTrustCard`
- `MatchPreviewCard`

Component rules:
- One dominant CTA per screen.
- Secondary actions must never match the visual weight of the primary CTA.
- Cards use tonal separation before borders.

## 9. Dopamine and Habit Loop Design

Loop model:
- Trigger: nearby live or upcoming matches
- Action: one-tap join or ultra-fast create
- Reward: instant confirmation, visible slot change, social anticipation
- Investment: saved area, preferred time, skill profile, recurring participation

Repeat-use features:
- “오늘 뛸 수 있는 경기” module on home
- participation streak or monthly play count
- subtle “2자리 남음” urgency
- recently joined / played with section
- smart resurfacing of favorite grounds and play windows

Important:
- Use variable reward through fresh nearby supply, not casino-style gimmicks.
- Keep excitement athletic and social, not manipulative.

## 10. UX Decisions That Matter Most

- Show relevance before navigation.
- Use date, distance, and remaining slots as the main decision stack.
- Remove dead-end screens.
- Use onboarding to shape the first feed, not to collect profile data.
- Keep create flow asymmetric: fast by default, detailed only if needed.
- Use overlays only for critical pickers like date/time, not for ordinary confirmations.

## 11. React / Web Implementation Structure

Recommended folder structure:

```txt
src/
  components/
    app/
      app-shell.tsx
      top-bar.tsx
      bottom-action-tray.tsx
    onboarding/
      location-step.tsx
      skill-step.tsx
      time-step.tsx
    feed/
      feed-screen.tsx
      match-card.tsx
      filter-rail.tsx
      slot-progress.tsx
    match/
      match-hero.tsx
      host-trust-card.tsx
      join-bar.tsx
    create/
      create-flow.tsx
      basics-step.tsx
      roster-step.tsx
      publish-step.tsx
  lib/
    design-tokens.ts
```

Token shape:

```ts
export const tokens = {
  color: {
    bgBase: "#F6F8F6",
    bgElevated: "#FFFFFF",
    bgSoft: "#EEF2EE",
    textPrimary: "#0C140F",
    textSecondary: "#5F6A63",
    brandPrimary: "#112317",
    accentLime: "#B8FF5A",
    accentBlue: "#4DA3FF",
    urgent: "#FF5E57",
  },
  radius: {
    card: "20px",
    button: "16px",
    chip: "999px",
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
  },
};
```

Implementation guidance:
- Use `position: sticky` for filters and bottom trays.
- Reserve bottom padding under fixed CTA bars.
- Use `dvh` units for full-height mobile screens.
- Keep list cards SSR-friendly and skeleton-ready.

## 12. Anti-Patterns to Avoid

- Generic SaaS blue-purple gradient heroes
- Dense form layouts on mobile
- Border-heavy cards
- Tiny chips with weak tap targets
- Multiple competing CTA buttons in the same viewport
- Modals for non-critical decisions
- Overusing lime until the app feels gamey instead of premium

## 13. Final Product Direction

FootLink should feel like the fastest route from intention to kickoff.

If Nike Run Club gives motivation, Tinder gives speed, and Airbnb gives trust, FootLink should combine them into one mobile behavior:
- see a match
- feel urgency
- understand fit
- join in one tap
- come back next weekend without friction
