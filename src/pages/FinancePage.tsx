import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { Wallet, TrendingUp, TrendingDown, Plus, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { FinanceForm } from '@/components/forms/FinanceForm'
import { db } from '@/lib/supabase'
import { toast } from 'sonner'
import type { FinanceRecord } from '@/lib/types'
import type { FinanceInput } from '@/lib/validation'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function FinancePage() {
  const [params, setParams] = useSearchParams()
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [month, setMonth] = useState(currentMonth())

  const loadData = useCallback(() => {
    setLoading(true)
    db.getFinance(month)
      .then((data: FinanceRecord[]) => {
        // Filter client-side for the exact month (API only uses gte)
        const filtered = data.filter((r) => r.date && r.date.startsWith(month))
        setRecords(filtered)
      })
      .catch(() => toast.error('Не вдалося завантажити дані'))
      .finally(() => setLoading(false))
  }, [month])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-open form on ?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      setFormOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  async function handleSave(data: FinanceInput) {
    await db.addFinance(data)
    toast.success('Транзакцію додано')
    loadData()
  }

  const income = records
    .filter((r) => r.type === 'income')
    .reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0)
  const expense = records
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0)
  const profit = income - expense

  return (
    <>
      <PageHeader title="Фінанси" icon={<Wallet className="h-5 w-5" />} />

      <div className="p-4 space-y-4">
        {/* Month picker */}
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
        />

        {/* Summary cards */}
        {!loading && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border bg-card p-3 shadow-sm">
                <p className="text-xs text-muted-foreground">Дохід</p>
                <p className="mt-1 text-lg font-bold text-green-500">
                  {income.toLocaleString('uk-UA')} грн
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3 shadow-sm">
                <p className="text-xs text-muted-foreground">Витрати</p>
                <p className="mt-1 text-lg font-bold text-red-500">
                  {expense.toLocaleString('uk-UA')} грн
                </p>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Прибуток</p>
              <p className={`mt-1 text-lg font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {profit >= 0 ? '+' : ''}{profit.toLocaleString('uk-UA')} грн
              </p>
            </div>
          </div>
        )}

        {/* Transaction list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Wallet className="h-10 w-10" />
            <p className="text-sm">Транзакцій немає</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {records.map((rec) => {
              const isIncome = rec.type === 'income'
              return (
                <li
                  key={rec.id}
                  className="flex min-h-[44px] items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isIncome ? 'bg-green-500/15' : 'bg-red-500/15'
                    }`}
                  >
                    {isIncome ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {rec.comment || rec.category || (isIncome ? 'Дохід' : 'Витрата')}
                    </p>
                    {rec.category && rec.comment && (
                      <p className="truncate text-xs text-muted-foreground">{rec.category}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">{rec.date}</p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      isIncome ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {parseFloat(String(rec.amount)).toLocaleString('uk-UA')} грн
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        aria-label="Нова транзакція"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Sheet */}
      <FinanceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}
