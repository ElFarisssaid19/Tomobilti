import Button from './Button.jsx'

/**
 * Circular icon-only button, on the raised surface by default (search, favorite, menu).
 * `label` is required: it becomes the accessible name.
 *
 * @example <IconButton icon={Search} label="Rechercher" />
 */
export default function IconButton({ icon, label, variant = 'secondary', size = 'md', ...props }) {
  return (
    <Button iconOnly leftIcon={icon} aria-label={label} variant={variant} size={size} {...props} />
  )
}
