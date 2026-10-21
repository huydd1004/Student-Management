import type { LucideIcon } from "lucide-react"

type PlaceholderPageProps = {
    title: string
    description: string
    icon: LucideIcon
}

export function PlaceholderPage({
    title,
    description,
    icon: Icon,
}: PlaceholderPageProps) {
    return (
        <main className="p-5 md:p-8">
            <section className="rounded-3xl border border-pink-100 bg-white p-8 shadow-sm">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                    <Icon aria-hidden="true" size={27} />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">{title}</h2>

                <p className="mt-2 max-w-2xl leading-7 text-slate-600">{description}</p>

                <div className="mt-8 rounded-2xl border border-dashed border-pink-200 bg-lotus-50/50 p-6 text-sm text-slate-600">
                    Giao diện của phần này sẽ được xây dựng ở bước tiếp theo.
                </div>
            </section>
        </main>
    )
}