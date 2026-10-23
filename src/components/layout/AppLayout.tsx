import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router'
import { CLASSROOM_CONFIG } from '../../config/classroom'
import { ThemeToggle } from '../theme/ThemeToggle'
import { AppSidebar } from './AppSidebar'

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const scrollPosition = window.scrollY
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    const previousHtmlOverflow =
      document.documentElement.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollPosition}px`
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyStyles.overflow
      document.body.style.position = previousBodyStyles.position
      document.body.style.top = previousBodyStyles.top
      document.body.style.width = previousBodyStyles.width
      window.scrollTo(0, scrollPosition)
    }
  }, [isMobileMenuOpen])

  function openMobileMenu() {
    setIsMobileMenuOpen(true)
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AppSidebar
        isMobileOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-lotus-50 hover:text-lotus-700 lg:hidden"
              aria-label="Mở menu"
              aria-controls="app-sidebar"
              aria-expanded={isMobileMenuOpen}
              onClick={openMobileMenu}
            >
              <Menu aria-hidden="true" size={21} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm text-slate-500">
                {CLASSROOM_CONFIG.schoolName}
              </p>

              <h1 className="truncate text-xl font-bold text-slate-900">
                Quản lý lớp {CLASSROOM_CONFIG.className}
              </h1>
            </div>
          </div>

          <ThemeToggle />
        </header>

        <Outlet />
      </div>
    </div>
  )
}
