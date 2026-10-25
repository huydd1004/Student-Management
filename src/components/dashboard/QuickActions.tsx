import {
  Bot,
  ClipboardCheck,
  Dices,
  Timer,
} from 'lucide-react'
import { Link } from 'react-router'

const quickActions = [
  {
    title: 'Điểm danh hôm nay',
    description: 'Ghi nhận tình hình lớp',
    icon: ClipboardCheck,
    to: '/attendance',
    highlighted: true,
  },
  {
    title: 'Kiểm tra bài cũ',
    description: 'Chọn học sinh và trò chơi',
    icon: Dices,
    to: '/lesson-check',
    highlighted: false,
  },
  {
    title: 'Đồng hồ làm bài',
    description: 'Trình chiếu thời gian còn lại',
    icon: Timer,
    to: '/timer',
    highlighted: false,
  },
  {
    title: 'Trợ lý AI',
    description: 'Soạn bài và nhận xét nhanh',
    icon: Bot,
    to: '/ai-assistant',
    highlighted: false,
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map(
          ({ title, description, icon: Icon, to, highlighted }) => (
            <Link
              key={title}
              to={to}
              className={`group flex min-h-24 items-center gap-4 rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                highlighted
                  ? 'quick-action-highlighted border-pink-200 bg-[linear-gradient(135deg,#ffffff_0%,#fff1f6_100%)]'
                  : 'border-slate-200 bg-white hover:border-pink-200 hover:bg-lotus-50'
              }`}
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition ${
                  highlighted
                    ? 'bg-lotus-600 text-white'
                    : 'bg-lotus-50 text-lotus-700 group-hover:bg-lotus-600 group-hover:text-white'
                }`}
              >
                <Icon aria-hidden="true" size={23} strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-slate-900">
                  {title}
                </span>
                <span className="mt-1 block text-sm leading-5 text-slate-500">
                  {description}
                </span>
              </span>
            </Link>
          ),
        )}
      </div>
    </section>
  )
}
