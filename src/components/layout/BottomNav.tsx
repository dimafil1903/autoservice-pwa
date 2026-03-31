import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Home, Users, ClipboardList, Wallet, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/', icon: Home, label: 'Головна' },
  { path: '/clients', icon: Users, label: 'Клієнти' },
  { path: '/orders', icon: ClipboardList, label: 'Замовлення' },
  { path: '/finance', icon: Wallet, label: 'Фінанси' },
  { path: '/settings', icon: Settings, label: 'Налаштування' },
] as const

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handleResize = () => {
      const keyboardVisible = vv.height < window.innerHeight * 0.75
      setKeyboardOpen(keyboardVisible)
    }

    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  if (keyboardOpen) return null

  return (
    <nav className="shrink-0 bg-card border-t border-border">
      <div className="flex items-center justify-around">
        {tabs.map(({ path, icon: Icon }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center py-2 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-6 w-6" />
            </button>
          )
        })}
      </div>
      <div className="safe-bottom" />
    </nav>
  )
}
