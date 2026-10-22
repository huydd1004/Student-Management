import {
  ClipboardCheck,
  Dices,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  School,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '../../auth/AuthProvider'
import { CLASSROOM_CONFIG } from '../../config/classroom'
import { ThemeToggle } from '../theme/ThemeToggle'

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
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')

  async function handleSignOut() {
    setIsSigningOut(true)
    setSignOutError('')

    try {
      await signOut()
    } catch {
      setSignOutError('Không thể đăng xuất. Vui lòng thử lại.')
      setIsSigningOut(false)
    }
  }

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
        <div className="relative flex flex-col items-center px-2 pb-5 pt-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-lotus-600 text-white shadow-lg shadow-lotus-200/50">
            <School aria-hidden="true" size={23} />
          </div>

          <p className="mt-3 rounded-full bg-lotus-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-lotus-700">
            Năm học {CLASSROOM_CONFIG.schoolYear}
          </p>

          <div className="mt-3 min-w-0">
            <p className="text-xs font-semibold uppercase leading-5 tracking-[0.06em] text-lotus-600">
              {CLASSROOM_CONFIG.schoolName}
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              Lớp {CLASSROOM_CONFIG.className}
            </p>
          </div>

          <button
            type="button"
            className="absolute right-0 top-3 flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
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

        <div className="mt-auto space-y-3 pt-5">
          <ThemeToggle showLabel />

          <div className="rounded-2xl border border-slate-200 p-3">
            <div className="min-w-0 px-1 pb-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.displayName || 'Thành viên lớp'}
              </p>
            </div>

            <button
              type="button"
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-3 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={18}
                />
              ) : (
                <LogOut aria-hidden="true" size={18} />
              )}
              {isSigningOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>

            {signOutError ? (
              <p
                role="alert"
                className="mt-2 text-center text-xs font-medium text-red-700"
              >
                {signOutError}
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  )
}
