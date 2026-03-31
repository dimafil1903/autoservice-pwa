import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Home, Plus, UserPlus, ClipboardList, CreditCard, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { db } from '@/lib/supabase'
import type { DashboardStats } from '@/lib/types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Замовлень сьогодні', value: stats?.ordersToday ?? 0, color: 'text-blue-600' },
    { label: 'Активних', value: stats?.ordersActive ?? 0, color: 'text-orange-500' },
    { label: 'Дохід за місяць', value: `${(stats?.revenueMonth ?? 0).toLocaleString('uk-UA')} грн`, color: 'text-green-600' },
    { label: 'Всього клієнтів', value: stats?.totalClients ?? 0, color: 'text-purple-600' },
  ]

  const quickActions = [
    { label: 'Нове замовлення', icon: Plus, path: '/orders?new=1', color: 'bg-blue-50 text-blue-600' },
    { label: 'Новий клієнт', icon: UserPlus, path: '/clients?new=1', color: 'bg-green-50 text-green-600' },
    { label: 'Всі замовлення', icon: ClipboardList, path: '/orders', color: 'bg-orange-50 text-orange-600' },
    { label: 'Транзакція', icon: CreditCard, path: '/finance?new=1', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <>
      <PageHeader title="Головна" icon={<Home className="h-5 w-5" />} />

      <div className="p-4 space-y-5">
        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border bg-card p-3 shadow-sm"
              >
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`mt-1 text-xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Швидкі дії</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex min-h-[44px] items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors active:bg-secondary"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
