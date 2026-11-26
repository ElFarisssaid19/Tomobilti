import { Card, InfoTip } from '../../components/ui'

/**
 * One block of the profile page: title (with an optional `info` tooltip for a rule or a
 * consequence) and badge on the left (desktop), the form in a card on the right.
 */
export default function ProfileSection({ id, title, info, badge, children }) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-5 border-t border-line pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <h3 id={id} className="text-xl font-bold text-fg">
            {title}
          </h3>
          {info && <InfoTip content={info} label={`À propos : ${title}`} />}
        </div>
        {badge}
      </div>
      <Card padding="lg">{children}</Card>
    </section>
  )
}
