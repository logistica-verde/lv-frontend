import { Moon, Sun } from 'lucide-react'
import IconButton from '@/components/IconButton/IconButton'
import { useTheme } from '@/hooks/useTheme'
import { setTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const theme = useTheme()
  const dark = theme === 'dark'

  return (
    <IconButton
      label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </IconButton>
  )
}
