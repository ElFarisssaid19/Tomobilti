/*
 * Placement of floating hints (Tooltip) inside the viewport.
 */

const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

/** Gap between the trigger and the tooltip, and minimum margin to the viewport edges. */
const GAP = 8
const MARGIN = 8

/**
 * Where to put a tooltip of `size` next to `trigger` (a DOMRect) so it stays inside
 * the viewport: the preferred side, or the opposite one when it does not fit there,
 * then shifted along the edge so no part leaves the screen. Pure, so it is tested.
 *
 * @returns {{ top: number, left: number, side: 'top'|'bottom'|'left'|'right' }}
 */
export function placeTooltip(trigger, size, preferred, viewport) {
  const room = {
    top: trigger.top - GAP - MARGIN,
    bottom: viewport.height - trigger.bottom - GAP - MARGIN,
    left: trigger.left - GAP - MARGIN,
    right: viewport.width - trigger.right - GAP - MARGIN,
  }
  const needed = preferred === 'top' || preferred === 'bottom' ? size.height : size.width
  const side =
    room[preferred] >= needed || room[OPPOSITE[preferred]] < room[preferred]
      ? preferred
      : OPPOSITE[preferred]

  const clamp = (value, max) => Math.min(Math.max(value, MARGIN), Math.max(MARGIN, max))
  if (side === 'top' || side === 'bottom') {
    return {
      side,
      top: side === 'top' ? trigger.top - GAP - size.height : trigger.bottom + GAP,
      left: clamp(
        trigger.left + trigger.width / 2 - size.width / 2,
        viewport.width - size.width - MARGIN,
      ),
    }
  }
  return {
    side,
    left: side === 'left' ? trigger.left - GAP - size.width : trigger.right + GAP,
    top: clamp(
      trigger.top + trigger.height / 2 - size.height / 2,
      viewport.height - size.height - MARGIN,
    ),
  }
}
