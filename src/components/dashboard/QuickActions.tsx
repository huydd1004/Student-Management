import { ArrowRight, ClipboardCheck, Dices } from 'lucide-react'

const quickActions = [
  {
    title: 'Điểm danh hôm nay',
    description:
      'Ghi nhận học sinh có mặt, vắng có phép hoặc vắng không phép theo từng buổi.',
    status: 'Chưa điểm danh',
    buttonLabel: 'Bắt đầu điểm danh',
    icon: ClipboardCheck,
    cardClass:
      'border-pink-200 bg-[linear-gradient(135deg,#ffffff_0%,#fff1f6_100%)]',
    iconClass: 'bg-lotus-600 text-white',
    statusClass: 'bg-white text-lotus-700 ring-1 ring-pink-100',
    buttonClass:
      'bg-lotus-600 text-white hover:bg-lotus-700 focus-visible:outline-lotus-600',
  },
  {
    title: 'Kiểm tra bài cũ',
    description:
      'Chọn ngẫu nhiên một học sinh trong lớp để trả bài hoặc kiểm tra kiến thức.',
    status: 'Sẵn sàng',
    buttonLabel: 'Gọi một học sinh',
    icon: Dices,
    cardClass: 'border-slate-200 bg-white',
    iconClass: 'bg-lotus-50 text-lotus-700',
    statusClass: 'bg-emerald-50 text-emerald-700',
    buttonClass:
      'border border-pink-200 bg-white text-lotus-700 hover:bg-lotus-50 focus-visible:outline-lotus-600',
  },
]

export function QuickActions() {
  return (
    <section className="mt-8" aria-labelledby="quick-actions-title">
      <div>
        <h2
          id="quick-actions-title"
          className="text-xl font-bold text-slate-900"
        >
          Thao tác nhanh
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Truy cập nhanh những công việc thường dùng trong lớp.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {quickActions.map(
          ({
            title,
            description,
            status,
            buttonLabel,
            icon: Icon,
            cardClass,
            iconClass,
            statusClass,
            buttonClass,
          }) => (
            <article
              key={title}
              className={`rounded-3xl border p-6 shadow-sm ${cardClass}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                >
                  <Icon aria-hidden="true" size={24} strokeWidth={1.9} />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                >
                  {status}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                {title}
              </h3>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                {description}
              </p>

              <button
                type="button"
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${buttonClass}`}
              >
                {buttonLabel}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </article>
          ),
        )}
      </div>
    </section>
  )
}