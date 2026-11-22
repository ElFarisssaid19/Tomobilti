import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/*
 * tailwind-merge must know our custom theme names, otherwise it would treat
 * `text-display` as a color and drop it when merged with `text-fg`.
 * Keep in sync with the @theme block in src/index.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display-sm', 'display', 'display-lg'],
      radius: ['input', 'card', 'card-lg'],
      shadow: ['glow-lime', 'glow-violet', 'pop', 'inner-light'],
      animate: ['shimmer', 'glow-drift'],
      container: ['page', 'nav'],
    },
  },
})

/** Join class names conditionally and resolve Tailwind conflicts (last one wins). */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
