import { describe, expect, it } from 'vitest'
import { placeTooltip } from './placement.js'

const VIEWPORT = { width: 375, height: 667 }
const SIZE = { width: 200, height: 40 }

function rect(left, top, width = 32, height = 32) {
  return { left, top, width, height, right: left + width, bottom: top + height }
}

describe('placeTooltip', () => {
  it('centres the tooltip above the trigger when there is room', () => {
    expect(placeTooltip(rect(170, 300), SIZE, 'top', VIEWPORT)).toEqual({
      side: 'top',
      top: 252,
      left: 86,
    })
  })

  it('flips below when the top of the screen has no room', () => {
    const position = placeTooltip(rect(170, 10), SIZE, 'top', VIEWPORT)
    expect(position.side).toBe('bottom')
    expect(position.top).toBe(50)
  })

  it('stays 8px inside the left and right edges', () => {
    expect(placeTooltip(rect(4, 300), SIZE, 'top', VIEWPORT).left).toBe(8)
    expect(placeTooltip(rect(340, 300), SIZE, 'top', VIEWPORT).left).toBe(375 - 200 - 8)
  })

  it('flips a side tooltip to the left near the right edge', () => {
    const position = placeTooltip(rect(300, 300), SIZE, 'right', VIEWPORT)
    expect(position.side).toBe('left')
    expect(position.left).toBe(300 - 8 - 200)
  })
})
