import { cn } from '../../lib/cn.js'

/** A section of the style guide, with an anchor. */
export function DemoSection({ id, title, description, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-line pt-12 first:border-t-0 first:pt-0"
    >
      <div className="mb-8 flex max-w-2xl flex-col gap-2">
        <h2 className="text-3xl font-bold text-fg">{title}</h2>
        {description && <p className="text-base text-fg-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-10">{children}</div>
    </section>
  )
}

/** A titled group inside a section. */
export function DemoGroup({ title, note, className, children }) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-fg">{title}</h3>
        {note && <p className="text-sm text-fg-muted">{note}</p>}
      </div>
      {children}
    </div>
  )
}

/** One example with a caption below it. */
export function Specimen({ label, className, children }) {
  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      {children}
      <span className="text-xs text-fg-subtle">{label}</span>
    </div>
  )
}

/** Panel holding examples. */
export function DemoPanel({ className, children }) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-card-lg border border-line bg-surface/50 p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Inline code. */
export function Code({ children }) {
  return (
    <code className="rounded-xs bg-raised px-1.5 py-0.5 font-mono text-[0.8125rem] text-fg">
      {children}
    </code>
  )
}
