import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
