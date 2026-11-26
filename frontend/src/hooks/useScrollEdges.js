import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tracks whether a scroll container has hidden content before or after the visible
 * part, on one axis. Overlays use it to show a divider under their header or above
 * their footer only while the body really scrolls; Tabs use it for their edge fades.
 *
 * @param {'y'|'x'} axis
 * @returns {[import('react').RefCallback<HTMLElement>, { start: boolean, end: boolean }, HTMLElement|null]}
 */
export default function useScrollEdges(axis = 'y') {
  const [node, setNode] = useState(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const frame = useRef(0)

  const measure = useCallback(() => {
    if (!node) return
    const position = axis === 'y' ? node.scrollTop : Math.abs(node.scrollLeft)
    const size = axis === 'y' ? node.clientHeight : node.clientWidth
    const total = axis === 'y' ? node.scrollHeight : node.scrollWidth
    const start = position > 1
    const end = position + size < total - 1
    setEdges((current) =>
      current.start === start && current.end === end ? current : { start, end },
    )
  }, [node, axis])

  useEffect(() => {
    if (!node) return undefined
    const schedule = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(measure)
    }
    schedule()
    node.addEventListener('scroll', schedule, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    observer?.observe(node)
    // Content that grows (a list that loads, an error under a field) changes scrollHeight.
    for (const child of node.children) observer?.observe(child)
    const mutations =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(schedule)
    mutations?.observe(node, { childList: true, subtree: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame.current)
      node.removeEventListener('scroll', schedule)
      observer?.disconnect()
      mutations?.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [node, measure])

  return [setNode, edges, node]
}
