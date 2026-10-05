# THIGO UI System

THIGO serves people ordering, preparing, delivering, and overseeing time-sensitive work. The interface should feel calm, direct, and trustworthy: clear hierarchy, fast comprehension, low cognitive load, reliable touch interaction, operational readability, accessibility, and cross-app consistency come before decoration.

> **DESIGN LANGUAGE IS CONSTRAINED. SCREEN COMPOSITION MAY EVOLVE.**

The visual language, semantics, and interaction rules below are shared. Screen structure may differ by role and device because Customer, Merchant, Driver, and Admin do different work.

## Evidence and interpretation

This foundation synthesizes current platform guidance rather than copying a competitor's brand or layout:

- Apple recommends clear hierarchy, adaptive layouts, familiar behavior, a visible press state, and at least a 44 x 44 pt button hit region ([HIG layout](https://developer.apple.com/design/human-interface-guidelines/layout), [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
- Android recommends 48 x 48 dp touch targets, 4.5:1 text contrast, 3:1 non-text contrast, scalable text, labels, and alternatives to gesture-only actions ([Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)).
- Material's semantic color pairs and type roles support consistent hierarchy without color-name coupling ([color roles](https://m3.material.io/styles/color/the-color-system), [typography](https://m3.material.io/styles/typography/applying-type)).
- React Native exposes native accessibility semantics and `Pressable` feedback/hit-area behavior; Expo expects platform-standard stack/tab navigation rather than a custom navigation model ([React Native accessibility](https://reactnative.dev/docs/accessibility), [`Pressable`](https://reactnative.dev/docs/Pressable), [Expo navigation](https://docs.expo.dev/develop/app-navigation/)).
- Mature delivery products consistently foreground the current job, status, timing, and next action. Official Grab, DoorDash, and Uber Eats material shows merchants managing active orders in one place, explicit store/order states, drivers receiving pickup/drop-off context, and exception actions close to the affected order ([GrabMerchant operations](https://merchant.grab.com/en-sg/guides/default/managing-your-store-and-orders), [DoorDash merchant operations](https://merchants.doordash.com/en-us/products/merchant-portal), [DoorDash pickup/drop-off guidance](https://help.doordash.com/dashers/s/article/How-to-use-Pickup-and-Drop-off-Information), [Uber Eats Order Manager](https://merchants.ubereats.com/gb/en/technology/manage-orders/overview/)). THIGO adopts those general interaction lessons, not their branding or exact composition.

## Source of truth and extension rule

Code imports semantic values from `@thigo/design-tokens`. This document defines how they are used. Do not add local hex colors, one-off spacing, untracked type styles, or a new control appearance because a screen is unusual.

When the system genuinely has a gap:

1. Explain the user or operational problem the current system cannot solve.
2. Propose the smallest semantic extension, not a screen-specific exception.
3. Update this document and `packages/design-tokens` together.
4. Apply the extension consistently and verify contrast, touch behavior, Vietnamese text, and both mobile platforms or the intended web viewport.

## Color

The palette is restrained: neutral surfaces and text carry most of the interface; THIGO green identifies trusted primary action; status colors communicate meaning only. Never use color as the only status cue.

| Semantic role               | Value     | Use                                     |
| --------------------------- | --------- | --------------------------------------- |
| `brand.primary`             | `#146C43` | Primary action, focus, selected state   |
| `brand.primaryPressed`      | `#0E5535` | Pressed primary action                  |
| `brand.primarySubtle`       | `#E7F3EC` | Selected or supportive brand surface    |
| `surface.primary`           | `#FFFFFF` | Main canvas                             |
| `surface.secondary`         | `#F5F7F6` | Grouped content background              |
| `surface.elevated`          | `#FFFFFF` | Floating content before shadow          |
| `surface.inverse`           | `#17211B` | High-contrast temporary/inverse surface |
| `text.primary`              | `#17211B` | Main copy                               |
| `text.secondary`            | `#526158` | Supporting copy                         |
| `text.inverse`              | `#FFFFFF` | Copy on dark/brand fills                |
| `text.link`                 | `#0E5A38` | Underlined text links                   |
| `text.disabled`             | `#66736B` | Disabled copy only                      |
| `border.default`            | `#7D8C83` | Form/control boundary                   |
| `border.subtle`             | `#D8E0DB` | Nonessential separation                 |
| `border.focus`              | `#146C43` | Visible focus boundary                  |
| `status.success`            | `#16663E` | Successful state text/icon              |
| `status.successBackground`  | `#E8F5ED` | Successful state background             |
| `status.warning`            | `#7A4D00` | Warning state text/icon                 |
| `status.warningBackground`  | `#FFF4D6` | Warning state background                |
| `status.danger`             | `#A1261D` | Error/destructive state text/icon       |
| `status.dangerBackground`   | `#FDECEA` | Error/destructive state background      |
| `status.info`               | `#175CD3` | Informational state text/icon           |
| `status.infoBackground`     | `#EAF1FF` | Informational state background          |
| `action.secondaryPressed`   | `#E7F3EC` | Pressed secondary action                |
| `action.disabled`           | `#D9E0DC` | Disabled control fill                   |
| `action.destructive`        | `#B42318` | Destructive action fill                 |
| `action.destructivePressed` | `#8F1D15` | Pressed destructive action              |

Approved text/background pairs meet at least 4.5:1 for normal text. White on `brand.primary` is 6.45:1 and white on `action.destructive` is 6.57:1; the four status foreground/background pairs exceed 5:1. `border.default` exceeds 3:1 on primary and secondary surfaces. Do not improvise pairings from individual values.

## Typography

Use one system-compatible strategy: the native system font on iOS and Android, and the system UI stack on web. Do not add a font asset until testing proves the system fonts cannot meet the need. System fonts render Vietnamese diacritics well and respect platform text settings.

| Role            | Size / line | Weight | Use                                              |
| --------------- | ----------- | ------ | ------------------------------------------------ |
| `screenTitle`   | 28 / 34     | 700    | One page or screen title                         |
| `sectionTitle`  | 20 / 26     | 700    | Major content group                              |
| `itemTitle`     | 16 / 22     | 600    | Card, row, or order title                        |
| `body`          | 16 / 24     | 400    | Default content and form values                  |
| `bodySecondary` | 14 / 20     | 400    | Supporting detail                                |
| `label`         | 14 / 20     | 600    | Controls, field labels, statuses                 |
| `caption`       | 12 / 16     | 500    | Timestamps and compact metadata, never long copy |

- Keep letter spacing neutral; Vietnamese marks need room and must not clip.
- Support platform text scaling. Prefer reflow and taller controls over truncating important text.
- Use tabular numbers for timers, money columns, and changing operational counts when supported.
- Sentence case is the default. Do not use all caps for Vietnamese labels or status emphasis.

## Spacing, shape, density, and touch

- Spacing tokens: `xxs 4`, `xs 8`, `sm 12`, `md 16`, `lg 24`, `xl 32`, `xxl 48`.
- Radius tokens: `small 8`, `medium 12`, `large 16`, `full 999`.
- Mobile screens normally use `md` horizontal gutters; dense operational lists may use `sm` internally but keep clear group boundaries.
- Cards use `medium` radius and a border before shadow. Reserve raised elevation for floating or overlapping content and overlay elevation for sheets/modals.
- Every interactive mobile target is at least 48 x 48 dp. A 44 pt iOS target is the absolute compatibility floor; THIGO's shared default is 48.
- Icon glyphs may be 20–24, but padding or `hitSlop` must preserve the target. Adjacent targets must not overlap.
- Admin tables may be denser than mobile lists, but row actions remain keyboard reachable, focus visible, and at least 32px high; primary controls remain 40px or taller.

## Buttons

All button variants use `label` typography, `medium` radius, a standard 48 height (56 only for a single high-emphasis mobile action), centered content, and a visible pressed state. Preserve width while loading; replace the leading icon or label-adjacent space with a progress indicator, disable repeat activation, and keep an accessible loading label.

| Variant     | Appearance                                             | Use                                                       |
| ----------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Primary     | `brand.primary`, white label                           | The one most likely nondestructive action in a view       |
| Secondary   | Primary surface, `border.default`, primary text        | Important alternative or paired action                    |
| Tertiary    | No container, brand or neutral text                    | Low-emphasis, inline, or overflow action                  |
| Destructive | `action.destructive` or danger text on neutral surface | Irreversible or high-cost action; never styled as Primary |

- Prefer one Primary per view or decision region. Keep paired buttons the same height and size; hierarchy comes from style.
- Pressed: use the defined pressed fill or a clear 8–12% darkening/overlay mapped in tokens. Never rely on scale alone.
- Disabled: use `action.disabled` with `text.disabled`; remove press handling and expose disabled semantics. If an explanation is necessary, put it next to the control.
- Icons support a clear label; icon-only actions require a familiar symbol and accessible name. Put a leading icon before text; use a trailing icon only to signal direction or disclosure.
- Vietnamese labels start with a precise verb and name the result: `Đăng nhập`, `Lưu thay đổi`, `Xác nhận đơn`, `Bắt đầu giao hàng`, `Đã lấy hàng`, `Thử lại`, `Hủy đơn`. Avoid vague copy such as `OK`, `Tiếp tục` without context, or `Có`/`Không` for consequential actions.
- Destructive confirmation names the object and consequence: `Hủy đơn hàng` rather than `Xác nhận`.

## Component rules

- **Inputs:** Persistent visible label, clear value and helper/error text, 52 minimum height on mobile, `border.default`, and `brand.primary` focus. Never use placeholder text as the only label. Keep entered text available when validation fails.
- **Search:** Use only when a list is large enough to benefit. Label it by domain (`Tìm món ăn`, `Tìm đơn hàng`), provide clear, submit, loading, no-result, and failure behavior, and do not hide essential filtering behind search.
- **Cards:** Group one coherent object or decision. Favor border and spacing over shadow. A card may be tappable or contain actions, but avoid nested competing tap regions.
- **Lists:** Scan vertically, lead with identity/status, keep metadata order stable, and make row height content-driven. Use dividers or spacing consistently; virtualize long mobile lists.
- **Chips:** Use for compact filters, categories, or status only. Selected state needs more than color; status chips include text. Do not use chips as tiny general-purpose buttons.
- **Sheets and modals:** Use for focused, reversible decisions or short supporting flows. Give a title, explicit dismissal, stable actions, keyboard/safe-area handling, and an alternative to swipe dismissal. Use a full screen when content or decisions become long.
- **Tabs:** Represent peer destinations, not step order. Keep labels short, preserve state where appropriate, and make the active state visible by color plus shape/indicator.
- **Navigation bars and bottom navigation:** Show stable top-level destinations only. Use stack navigation for drill-in work. Preserve platform back behavior and never make a custom gesture the only way back.
- **Empty, loading, and error states:** Reserve layout where possible. Explain what is happening, whether data is absent or filtered, and the next useful action. Use skeletons only when structure is predictable; otherwise use a progress indicator. Never use endless shimmer as decoration.
- **Confirmation and destructive actions:** Confirm only meaningful risk. Name the affected object, state the consequence, make cancel easy, prevent double submission, and show the final result or recovery path.

## UX by application

### Customer

Discovery and ordering should feel progressive, not dense. Keep price, availability, fulfillment expectation, order total, and the next commitment clear. Preserve context when customers inspect an item or return from checkout. Trust beats promotional clutter.

### Merchant

Design for interruption and fast scanning. Active orders, elapsed/preparation time, fulfillment type, exceptions, and the next required action must dominate. Keep status transitions explicit and protect against accidental order or availability changes.

### Driver

Design for one-handed, glanceable use in changing environments. The current job, destination context, safe next action, contact/help path, and state confirmation take priority. Do not require fine touch, dense reading, or interaction while movement demands attention.

### Admin

Design for investigation and controlled operations. Favor tables, filters, stable information density, audit context, keyboard access, and clear bulk-selection boundaries. Destructive or cross-account changes require scoped confirmation and visible results.

## Navigation and responsive composition

- Use a small, stable set of top-level destinations; detail screens drill in and return to the same context.
- Put the role's current work and exceptions before reporting or settings.
- Deep links should land on a meaningful state and preserve access checks.
- Mobile composition is single-column by default. Adapt to larger widths with bounded content, split views, or supporting panels only when they improve comparison or continuity.
- Admin uses responsive tables/panels and collapses secondary detail before introducing horizontal page scrolling. A table may scroll inside a clearly bounded region when its columns are genuinely essential.

## Motion

Motion exists only for input feedback, state change, navigation continuity, or determinate/indeterminate progress. Use `fast` 120ms, `standard` 200ms, and `deliberate` 300ms tokens; most feedback should use `fast` or `standard`.

- Honor reduced-motion preferences. Replace large translation, zoom, parallax, and repeated motion with no motion or a short fade.
- Keep transitions interruptible and state-driven. Do not delay navigation or confirmation so an animation can finish.
- No decorative bouncing, pulsing, auto-advancing carousels, celebratory motion in operational flows, or continuous shimmer.

## Visual review checklist

- [ ] Hierarchy makes the current state and next action obvious.
- [ ] Only approved semantic tokens are used.
- [ ] Vietnamese text is readable, correctly accented, and uses specific action copy.
- [ ] Text and controls have no overflow or clipping at supported text sizes.
- [ ] Touch targets meet the applicable minimum and do not overlap.
- [ ] There is one clear primary action where a primary action is needed.
- [ ] Loading, empty, error, and disabled states are handled where relevant.
- [ ] The mobile viewport respects safe areas, keyboard, and representative device widths.
- [ ] There is no unnecessary horizontal scroll.
- [ ] The result is consistent with nearby existing patterns.
- [ ] Text, icons, controls, and status pairs meet contrast requirements.
