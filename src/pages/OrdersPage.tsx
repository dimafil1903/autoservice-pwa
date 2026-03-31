import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ClipboardList, Plus, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { OrderForm } from '@/components/forms/OrderForm'
import { db } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/types'
import type { OrderInput } from '@/lib/validation'

const statusColors: Record<OrderStatus, string> = {
  new: 'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
  done: 'bg-green-500/15 text-green-400',
  closed: 'bg-muted text-muted-foreground',
}

type TabFilter = 'all' | OrderStatus

const tabs: { value: TabFilter; label: string }[] = [
  { value: 'all', label: 'Всі' },
  { value: 'new', label: 'Нові' },
  { value: 'in_progress', label: 'В роботі' },
  { value: 'done', label: 'Виконані' },
  { value: 'closed', label: 'Закриті' },
]

export default function OrdersPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [filter, setFilter] = useState<TabFilter>('all')
  const [defaultCarId, setDefaultCarId] = useState<string | null>(null)

  const loadOrders = useCallback(() => {
    setLoading(true)
    const statusFilter = filter === 'all' ? undefined : filter
    db.getOrders(statusFilter)
      .then(setOrders)
      .catch(() => toast.error('Не вдалося завантажити замовлення'))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Auto-open form on ?new=1, pre-select car on ?carId=xxx
  useEffect(() => {
    if (params.get('new') === '1') {
      const carId = params.get('carId') || null
      setDefaultCarId(carId)
      setFormOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  async function handleSave(data: OrderInput) {
    await db.addOrder({ ...data, status: 'new' })
    toast.success('Замовлення створено')
    loadOrders()
  }

  return (
    <>
      <PageHeader title="Замовлення" icon={<ClipboardList className="h-5 w-5" />} />

      {/* Tab filter bar */}
      <div className="overflow-x-auto border-b">
        <div className="flex min-w-max px-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'min-h-[44px] px-3 py-2 text-sm font-medium transition-colors',
                filter === tab.value
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <ClipboardList className="h-10 w-10" />
          <p className="text-sm">Замовлень немає</p>
        </div>
      ) : (
        <ul className="divide-y">
          {orders.map((order) => (
            <li key={order.id}>
              <button
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex w-full min-h-[44px] items-center gap-3 px-4 py-3 text-left transition-colors active:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] border-0', statusColors[order.status])}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                  {order.problem && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {order.problem}
                    </p>
                  )}
                </div>
                {order.date_in && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {order.date_in}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      <button
        onClick={() => {
          setDefaultCarId(null)
          setFormOpen(true)
        }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        aria-label="Нове замовлення"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Sheet */}
      <OrderForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        defaultCarId={defaultCarId}
      />
    </>
  )
}
