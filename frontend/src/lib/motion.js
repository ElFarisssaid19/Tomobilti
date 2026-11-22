/*
 * Motion tokens and reusable variants for Motion for React ("motion/react").
 * Mirrors the CSS tokens in src/index.css (--duration-*, --ease-*). See DESIGN.md.
 *
 * Rules: animate only transform and opacity, 400ms or less, no loops except loaders.
 * <MotionConfig reducedMotion="user"> at the root turns transforms off for users who
 * ask for reduced motion (opacity fades still run).
 */

/** Durations in seconds (Motion uses seconds). */
export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
}

/** Cubic-bezier easings. */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
}

/** Default spring: quick, barely any bounce. Used by layout and shared layout animations. */
export const spring = {
  type: 'spring',
  visualDuration: 0.35,
  bounce: 0.15,
}

/** Ready-made transitions. */
export const transition = {
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  slow: { duration: duration.slow, ease: ease.out },
  spring,
}

/** Delay between items of a staggered list or grid. */
export const STAGGER = 0.05

/** Opacity only. */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
  exit: { opacity: 0, transition: transition.fast },
}

/** Fade + 12px rise. The default entrance for content blocks. */
export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transition.slow },
  exit: { opacity: 0, y: 8, transition: transition.fast },
}

/** Fade + slight scale. For dialogs, popovers and menus. */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transition.base },
  exit: { opacity: 0, scale: 0.96, transition: transition.fast },
}

/** Parent of a staggered list. Children use `staggerItem`. */
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
}

/** Child of `staggerContainer`. */
export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transition.slow },
}

/** Route change: fade + 8px slide (used with AnimatePresence mode="wait"). */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transition.base },
  exit: { opacity: 0, y: -8, transition: transition.fast },
}

/** Props for a list or grid that reveals once when it scrolls into view. */
export const revealOnView = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.15 },
  variants: staggerContainer,
}
