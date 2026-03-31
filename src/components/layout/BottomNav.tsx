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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
