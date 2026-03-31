import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto scroll-touch">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
