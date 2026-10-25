import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type StatCardProps = {
    title: string
    value: ReactNode
    description: string
    icon: LucideIcon
    tone?: 'pink' | 'green' | 'red' | 'amber'
}

const toneStyles = {
    pink: 'bg-lotus-50 text-lotus-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    tone = 'pink',
}: StatCardProps) {
    return (
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {title}
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {value}
            </p>
          </div>

          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${toneStyles[tone]}`}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={2} />
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">{description}</p>
      </article>
    )
}
