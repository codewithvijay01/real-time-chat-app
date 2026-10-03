import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() => localStorage.getItem('commonroom-theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('commonroom-theme', dark ? 'dark' : 'light')
  }, [dark])
  return <button className={`icon-button ${className}`} type="button" onClick={() => setDark((value) => !value)} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`Switch to ${dark ? 'light' : 'dark'} mode`}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
}