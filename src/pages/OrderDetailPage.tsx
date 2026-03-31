import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router'
import { Plus, Loader2, X, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { OrderItemForm } from '@/components/forms/OrderItemForm'
import { generateActPdf } from '@/components/ActDocument'
import { db } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Order, OrderItem, OrderStatus } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/types'
import type { OrderItemInput } from '@/lib/validation'

const statusColors: Record<OrderStatus, string> = {
  new: 'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
  done: 'bg-green-500/15 text-green-400',
  closed: 'bg-muted text-muted-foreground',
}

const allStatuses: OrderStatus[] = ['new', 'in_progress', 'done', 'closed']

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [actLoading, setActLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const [ordersData, itemsData] = await Promise.all([
        db.getOrders(),
        db.getOrderItems(id),
      ])
      const found = (ordersData as Order[]).find((o) => o.id === id)
      if (found) setOrder(found)
      setItems(itemsData as OrderItem[])
    } catch {
      toast.error('Не вдалося завантажити дані')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleAddItem(data: OrderItemInput) {
    await db.addOrderItem(data)
    toast.success('Позицію додано')
    loadData()
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await db.deleteOrderItem(itemId)
      toast.success('Позицію видалено')
      loadData()
    } catch {
      toast.error('Помилка видалення')
    }
  }

  async function handleStatusChange(status: OrderStatus) {
    if (!id || !order || order.status === status) return
    try {
      setStatusUpdating(true)
      await db.updateOrder(id, { status })
      setOrder((prev) => (prev ? { ...prev, status } : null))
      toast.success(`Статус: ${ORDER_STATUS_LABELS[status]}`)
    } catch {
      toast.error('Помилка оновлення статусу')
    } finally {
      setStatusUpdating(false)
    }
  }

  async function handleGenerateAct() {
    if (!id) return
    try {
      setActLoading(true)
      const blob = await generateActPdf(id)
      const url = URL.createObjectURL(blob)
      const actNum = id.slice(-6).toUpperCase()

      // Try native share on mobile (iOS/Android)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `Act-${actNum}.pdf`, { type: 'application/pdf' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Акт № ${actNum}` })
          URL.revokeObjectURL(url)
          return
        }
      }

      // Fallback: download link
      const a = document.createElement('a')
      a.href = url
      a.download = `Act-${actNum}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF збережено')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast.error('Помилка генерації акту')
        console.error(e)
      }
    } finally {
      setActLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Замовлення" back />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <PageHeader title="Замовлення" back />
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Замовлення не знайдено</p>
        </div>
      </>
    )
  }

  const worksTotal = items
    .filter((i) => i.type === 'work')
    .reduce((s, i) => s + (parseFloat(String(i.total)) || 0), 0)
  const partsTotal = items
    .filter((i) => i.type === 'part')
    .reduce((s, i) => s + (parseFloat(String(i.total)) || 0), 0)
  const grandTotal = worksTotal + partsTotal

  return (
    <>
      <PageHeader title={`#${order.id.slice(-6).toUpperCase()}`} back />

      <div className="p-4 space-y-4 pb-8">
        {/* Order Info Card */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Статус</span>
            <Badge
              variant="secondary"
              className={cn('border-0', statusColors[order.status])}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          {order.problem && (
            <div>
              <span className="text-xs text-muted-foreground">Проблема</span>
              <p className="text-sm">{order.problem}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {order.date_in && (
              <div>
                <span className="text-xs text-muted-foreground">Дата прийому</span>
                <p>{order.date_in}</p>
              </div>
            )}
            {order.date_out && (
              <div>
                <span className="text-xs text-muted-foreground">Дата видачі</span>
                <p>{order.date_out}</p>
              </div>
            )}
            {order.mileage && (
              <div>
                <span className="text-xs text-muted-foreground">Пробіг</span>
                <p>{order.mileage.toLocaleString('uk-UA')} км</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Card */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className="text-sm font-medium">Позиції</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemFormOpen(true)}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Додати
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                Позицій немає
              </p>
            </div>
          ) : (
            <div className="px-4 pb-4">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_40px_40px_60px_60px_28px] gap-1 text-[10px] font-medium text-muted-foreground border-b pb-1 mb-1">
                <span>Назва</span>
                <span className="text-right">Од.</span>
                <span className="text-right">К-ть</span>
                <span className="text-right">Ціна</span>
                <span className="text-right">Сума</span>
                <span />
              </div>

              {/* Table rows */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_40px_40px_60px_60px_28px] gap-1 items-center py-1.5 border-b border-border/50 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.name}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {item.type === 'work' ? 'Робота' : 'Запчастина'}
                    </span>
                  </div>
                  <span className="text-right text-muted-foreground">{item.unit}</span>
                  <span className="text-right">{item.qty}</span>
                  <span className="text-right">{parseFloat(String(item.price)).toFixed(0)}</span>
                  <span className="text-right font-medium">
                    {parseFloat(String(item.total)).toFixed(0)}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Видалити"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Subtotals */}
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Роботи: {worksTotal.toFixed(0)} грн</span>
                  <span>Запч.: {partsTotal.toFixed(0)} грн</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>Разом</span>
                  <span>{grandTotal.toFixed(2)} грн</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status change card */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Змінити статус</h3>
          <div className="grid grid-cols-2 gap-2">
            {allStatuses.map((s) => (
              <Button
                key={s}
                variant={order.status === s ? 'default' : 'outline'}
                size="sm"
                className="h-10 text-xs"
                disabled={statusUpdating}
                onClick={() => handleStatusChange(s)}
              >
                {ORDER_STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>

        {/* Generate Act button */}
        <Button
          className="w-full h-11 gap-2"
          variant="outline"
          onClick={handleGenerateAct}
          disabled={actLoading}
        >
          {actLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Завантажити Акт (PDF)
        </Button>
      </div>

      {/* Item Form Sheet */}
      {id && (
        <OrderItemForm
          open={itemFormOpen}
          orderId={id}
          onClose={() => setItemFormOpen(false)}
          onSave={handleAddItem}
        />
      )}

    </>
  )
}
