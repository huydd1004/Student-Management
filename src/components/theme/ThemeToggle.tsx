import { Moon, Sun } from 'lucide-react'

import { useTheme } from '../../theme/ThemeProvider'

type ThemeToggleProps = {
  showLabel?: boolean
}

export function ThemeToggle({
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark
    ? 'Chuyển sang giao diện sáng'
    : 'Chuyển sang giao diện tối'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        showLabel
          ? 'theme-toggle flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold transition'
          : 'theme-toggle flex size-10 shrink-0 items-center justify-center rounded-xl border transition'
      }
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun aria-hidden="true" size={20} />
      ) : (
        <Moon aria-hidden="true" size={20} />
      )}

      {showLabel ? (
        <span>{isDark ? 'Giao diện sáng' : 'Giao diện tối'}</span>
      ) : null}
    </button>
  )
}
