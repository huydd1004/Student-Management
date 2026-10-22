import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'

export type AppTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: AppTheme
  toggleTheme: () => void
}

const THEME_STORAGE_KEY = 'student-management-theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): AppTheme {
  const savedTheme = window.localStorage.getItem(
    THEME_STORAGE_KEY,
  )

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return 'dark'
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light',
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error(
      'useTheme phải được sử dụng bên trong ThemeProvider.',
    )
  }

  return context
}
