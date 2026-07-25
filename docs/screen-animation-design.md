# Task: build a <ScreenTransition> component (staggered content-in)

## Context
React app rendering "action" screens on two targets:
- **mobile**: screens switch instantly, no animation
- **TV** (10-foot UI, weak GPU — Android TV / WebOS / Tizen / Chromecast):
  staggered content-in transition, 1000ms

One shared component tree, one device-level flag. Do not fork the screens.

## API

```tsx
<TransitionConfigProvider value={{ target: 'tv' }}>
  <ScreenTransition screenKey={currentScreenId}>
    <ActionScreen id={currentScreenId} />
  </ScreenTransition>
</TransitionConfigProvider>
```

```ts
interface TransitionConfig {
  target: 'mobile' | 'tv';
  totalDuration?: number; // default: 1000 on tv, 0 on mobile
  easing?: string;        // default: 'cubic-bezier(0.2, 0, 0, 1)'
  maxStaggerStep?: number; // default: 70ms
}
```

## The transition — exact timing model
`totalDuration` is the time from navigation until the LAST child has finished.
Derive everything from it; never let the tail overrun.

Given `n` = number of staggered children:

exitDuration = totalDuration * 0.30 // outgoing container fades
enterDuration = totalDuration * 0.45 // per-child fade + rise
enterStart = totalDuration * 0.25 // overlaps the exit — no black gap
staggerBudget = totalDuration - enterStart - enterDuration
staggerStep = n > 1 ? Math.min(maxStaggerStep, staggerBudget / (n - 1)) : 0

- Outgoing layer: `opacity 1 → 0` over `exitDuration`, starting immediately.
- Incoming container: `opacity 1` from the start (no container-level fade —
  the children carry the animation).
- Each child `i` of `[data-stagger-root]`:
  `opacity 0 → 1` and `translateY(20px → 0)` over `enterDuration`,
  delayed by `enterStart + i * staggerStep`.
- Stagger order = DOM order. Header row animates first, then the grid children.

With n = 1 the result must be a plain fade-and-rise, not a special case branch.

## Hard constraints
- **Animate `transform` and `opacity` only.** No width/height/top/left/margin —
  they trigger layout every frame and stutter on TV hardware.
- No `filter: blur()`, no animated box-shadow, no 3D transforms.
- Use the **Web Animations API** (`element.animate()`). Do NOT add
  framer-motion, react-spring, react-transition-group, or any other library.
  Zero new runtime deps.
- Respect `prefers-reduced-motion: reduce` → behave exactly like `target: 'mobile'`.
- Both layers absolutely positioned inside a `position: relative` stage, so the
  outgoing screen doesn't affect layout and the container never collapses.
- Set `will-change: transform, opacity` on animating children only for the
  duration, then remove it. Permanent `will-change` pins GPU layers and hurts
  low-memory TV devices.
- Batch all `element.animate()` calls in a single `useLayoutEffect` pass —
  no per-child effects, no reads interleaved with writes.

## Behaviour
- **Interruptions:** if `screenKey` changes mid-transition, cancel running
  animations, drop the outgoing layer immediately, start fresh from the current
  visual state. Never queue, never drop a navigation.
- **Cleanup:** remove the outgoing layer on `animation.finished`, not on a
  `setTimeout`. No state updates after unmount, no leaked animation objects.
- **Mobile / `totalDuration: 0`:** early-exit path that swaps children
  synchronously — no second layer in the DOM, no `element.animate()` call,
  no extra render.
- If `[data-stagger-root]` is absent, stagger the direct children of the screen
  root instead. Never throw.

## Accessibility
- Stage has `aria-live="polite"`; outgoing layer gets `aria-hidden="true"` at the
  start of the transition so the new screen is announced once.
- Outgoing layer is `inert` while fading out.
- Move focus to the incoming screen's heading once the transition finishes.

## Deliverables
1. `ScreenTransition`
2. `TransitionConfigProvider` + `useTransitionConfig`
3. Unit tests:
   - `totalDuration: 0` and reduced-motion → zero `animate()` calls, one layer in
     the DOM at all times
   - timing math: for n = 1, 4, 12 assert the last child finishes at exactly
     `totalDuration`
   - `maxStaggerStep` caps the step when n is small
   - rapid `screenKey` changes → prior animations cancelled, exactly one layer
     remains after settling
   - unmount mid-transition → no warnings, no dangling animations
4. Storybook story (or demo route) with a screen-count control, so the tail
   timing is visually verifiable.

## Repo specifics
<!-- fill in before running -->
- Where `screenKey` comes from:
- How the tv/mobile target is determined:
- Styling approach:
- Test setup and TS strictness:

## Before you start
Read the existing screen components and the navigation layer, then propose the
file layout and confirm the timing model against a real screen's child count.
Wait for my go-ahead before writing implementation code.