/** Hover treatment shared by every clickable card: 4px lift, lighter border, violet glow. */
export const CARD_HOVER =
  'transition-[transform,border-color,box-shadow] duration-250 ease-out hover:border-line-strong hover:shadow-glow-violet motion-safe:hover:-translate-y-1'

/** Same treatment driven by a parent `group` (cards whose link is a stretched child). */
export const CARD_GROUP_HOVER =
  'transition-[transform,border-color,box-shadow] duration-250 ease-out hover:border-line-strong hover:shadow-glow-violet motion-safe:hover:-translate-y-1 has-[a:focus-visible]:border-line-strong'
