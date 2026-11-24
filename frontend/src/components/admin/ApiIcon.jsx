import { createElement } from 'react'
import { iconFor } from '../../lib/icons.js'

/** The lucide icon named by the API (categories.icon, extras.icon), decorative. */
export default function ApiIcon({ name, className }) {
  return createElement(iconFor(name), { className, 'aria-hidden': true })
}
