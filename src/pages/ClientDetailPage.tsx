import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Phone, Car, Plus, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { CarForm } from '@/components/forms/CarForm'
import { db } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Client, Car as CarType } from '@/lib/types'
import type { CarInput } from '@/lib/validation'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [cars, setCars] = useState<CarType[]>([])
  const [loading, setLoading] = useState(true)
  const [carFormOpen, setCarFormOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const [clients, carsData] = await Promise.all([
        db.get<Client>('clients', { id: `eq.${id}` }),
        db.getCars(id),
      ])
      if (clients[0]) setClient(clients[0])
      setCars(carsData)
    } catch {
      toast.error('Не вдалося завантажити дані')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleSaveCar(data: CarInput) {
    await db.addCar(data)
    toast.success('Авто додано')
    loadData()
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Клієнт" back />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  if (!client) {
    return (
      <>
        <PageHeader title="Клієнт" back />
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Клієнта не знайдено</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={client.name} back />

      <div className="p-4 space-y-4">
        {/* Contact Info Card */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Контактна інформація
          </h3>
          <p className="text-sm font-medium">{client.name}</p>
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="mt-1 flex items-center gap-2 text-sm text-primary"
            >
              <Phone className="h-3.5 w-3.5" />
              {client.phone}
            </a>
          )}
        </div>

        {/* Cars List */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Автомобілі
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCarFormOpen(true)}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Додати
            </Button>
          </div>

          {cars.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card py-8 text-muted-foreground shadow-sm">
              <Car className="h-8 w-8" />
              <p className="text-sm">Авто ще немає</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cars.map((car) => (
                <li key={car.id}>
                  <button
                    onClick={() =>
                      navigate(`/orders?new=1&carId=${car.id}`)
                    }
                    className="flex w-full min-h-[44px] items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors active:bg-secondary"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium">
                        {car.brand} {car.model}
                        {car.year ? ` ${car.year}` : ''}
                      </p>
                      {(car.plate || car.vin) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {car.plate && car.plate}
                          {car.plate && car.vin && ' / '}
                          {car.vin && car.vin}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Car Form Sheet */}
      {id && (
        <CarForm
          open={carFormOpen}
          clientId={id}
          onClose={() => setCarFormOpen(false)}
          onSave={handleSaveCar}
        />
      )}
    </>
  )
}
