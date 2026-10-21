import {
  ClipboardCheck,
  Dices,
  LayoutDashboard,
  School,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router'
import { CLASSROOM_CONFIG } from '../../config/classroom'

type AppSidebarProps = {
  isMobileOpen: boolean
  onClose: () => void
}

const navigationItems = [
  {
    label: 'Tổng quan',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    label: 'Học sinh',
    icon: Users,
    to: '/students',
  },
  {
    label: 'Điểm danh',
    icon: ClipboardCheck,
    to: '/attendance',
  },
  {
    label: 'Gọi bài',
    icon: Dices,
    to: '/lesson-check',
  },
  {
    label: 'Cài đặt',
    icon: Settings,
    to: '/settings',
  },
]

export function AppSidebar({
  isMobileOpen,
  onClose,
}: AppSidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Đóng menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] transition-opacity lg:hidden ${
          isMobileOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-pink-100 bg-white p-5 shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:min-h-screen lg:translate-x-0 lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lotus-600 text-white">
            <School aria-hidden="true" size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-lotus-600">
              {CLASSROOM_CONFIG.schoolName}
            </p>

            <p className="mt-1 font-bold text-slate-900">
              Lớp {CLASSROOM_CONFIG.className}
            </p>
          </div>

          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Đóng menu"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <nav
          className="mt-8 space-y-2"
          aria-label="Điều hướng chính"
        >
          {navigationItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? 'bg-lotus-50 text-lotus-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-lotus-50 p-4">
          <p className="text-xs font-semibold text-lotus-700">
            Năm học
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {CLASSROOM_CONFIG.schoolYear}
          </p>
        </div>
      </aside>
    </>
  )
}