import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Users, User, ChevronRight, Plus, Search, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/input'
import { ClientForm } from '@/components/forms/ClientForm'
import { db } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Client } from '@/lib/types'
import type { ClientInput } from '@/lib/validation'

export default function ClientsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const loadClients = useCallback(() => {
    setLoading(true)
    db.getClients()
      .then(setClients)
      .catch(() => toast.error('Не вдалося завантажити клієнтів'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  // Auto-open form when ?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      setFormOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  async function handleSave(data: ClientInput) {
    await db.addClient(data)
    toast.success('Клієнта додано')
    loadClients()
  }

  const q = search.toLowerCase()
  const filtered = search
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(search)),
      )
    : clients

  return (
    <>
      <PageHeader title="Клієнти" icon={<Users className="h-5 w-5" />} />

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Пошук за ім'ям або телефоном"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 text-base"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Users className="h-10 w-10" />
          <p className="text-sm">
            {search ? 'Нічого не знайдено' : 'Клієнтів поки немає'}
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {filtered.map((client) => (
            <li key={client.id}>
              <button
                onClick={() => navigate(`/clients/${client.id}`)}
                className="flex w-full min-h-[44px] items-center gap-3 px-4 py-3 text-left transition-colors active:bg-secondary"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{client.name}</p>
                  {client.phone && (
                    <p className="truncate text-xs text-muted-foreground">
                      {client.phone}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        aria-label="Додати клієнта"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Sheet */}
      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}
