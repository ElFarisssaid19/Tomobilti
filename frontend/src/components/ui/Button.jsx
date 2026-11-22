import { Link } from 'react-router'
import { cn } from '../../lib/cn.js'
import { buttonClasses, ICON_SIZES } from './buttonStyles.js'
import Spinner from './Spinner.jsx'

/**
 * Button. Renders a <button>, a router <Link> (`to`) or an <a> (`href`).
 *
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'|'link'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {import('react').ElementType} leftIcon lucide icon component
 * @param {import('react').ElementType} rightIcon lucide icon component
 * @param {boolean} iconOnly circular icon button: requires an `aria-label`
 * @param {boolean} loading shows a spinner, keeps the width, disables the button
 *
 * @example <Button leftIcon={Search}>Rechercher</Button>
 * @example <Button to="/voitures" variant="secondary">Voir les voitures</Button>
 * @example <Button iconOnly leftIcon={Heart} aria-label="Ajouter aux favoris" />
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconOnly = false,
  loading = false,
  disabled = false,
  to,
  href,
  type = 'button',
  className,
  children,
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading
  const classes = buttonClasses({
    variant,
    size,
    iconOnly,
    disabled: isDisabled,
    loading,
    className,
  })
  const iconClass = ICON_SIZES[size]

  const content = (
    <>
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
        {LeftIcon && <LeftIcon className={iconClass} aria-hidden="true" />}
        {!iconOnly && children}
        {RightIcon && !iconOnly && <RightIcon className={iconClass} aria-hidden="true" />}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
    </>
  )

  // Links cannot be disabled natively: render a non-interactive span instead.
  if ((to || href) && isDisabled) {
    return (
      <span className={classes} aria-disabled="true" {...props}>
        {content}
      </span>
    )
  }

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...props}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick} {...props}>
        {content}
      </a>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  )
}
