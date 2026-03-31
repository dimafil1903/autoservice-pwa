import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderSchema, type OrderInput } from '@/lib/validation'
import { db } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { Client, Car } from '@/lib/types'

interface CarOption {
  id: string
  label: string
}

interface OrderFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: OrderInput) => Promise<void>
  defaultCarId?: string | null
}

export function OrderForm({ open, onClose, onSave, defaultCarId }: OrderFormProps) {
  const [carOptions, setCarOptions] = useState<CarOption[]>([])
  const [loadingCars, setLoadingCars] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      car_id: defaultCarId || '',
      problem: '',
      mileage: '' as any,
      date_in: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (!open) return
    setLoadingCars(true)
    db.getClients()
      .then(async (clients: Client[]) => {
        const options: CarOption[] = []
        for (const client of clients) {
          const cars: Car[] = await db.getCars(client.id)
          for (const car of cars) {
            options.push({
              id: car.id,
              label: `${client.name} — ${car.brand} ${car.model}${car.plate ? ` (${car.plate})` : ''}`,
            })
          }
        }
        setCarOptions(options)
      })
      .catch(() => {})
      .finally(() => setLoadingCars(false))
  }, [open])

  useEffect(() => {
    if (open && defaultCarId) {
      reset({
        car_id: defaultCarId,
        problem: '',
        mileage: '' as any,
        date_in: new Date().toISOString().split('T')[0],
      })
    }
  }, [open, defaultCarId, reset])

  async function onSubmit(data: OrderInput) {
    await onSave(data)
    reset()
    onClose()
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      reset()
      onClose()
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <SheetHeader className="pb-2">
          <SheetTitle>Нове замовлення</SheetTitle>
          <SheetDescription>Заповніть дані замовлення</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 pb-4">
          <div className="space-y-1">
            <Label>Автомобіль *</Label>
            {loadingCars ? (
              <div className="flex h-11 items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Завантаження...
              </div>
            ) : (
              <Controller
                control={control}
                name="car_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full text-base">
                      <SelectValue placeholder="Оберіть авто" />
                    </SelectTrigger>
                    <SelectContent>
                      {carOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.car_id && (
              <p className="text-xs text-destructive">{errors.car_id.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="order-problem">Проблема *</Label>
            <Textarea
              id="order-problem"
              placeholder="Опишіть проблему"
              className="text-base"
              rows={2}
              {...register('problem')}
            />
            {errors.problem && (
              <p className="text-xs text-destructive">{errors.problem.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="order-mileage">Пробіг (км)</Label>
              <Input
                id="order-mileage"
                type="number"
                placeholder="0"
                className="h-11 text-base"
                {...register('mileage')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="order-date">Дата прийому</Label>
              <Input
                id="order-date"
                type="date"
                className="h-11 text-base"
                {...register('date_in')}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="!mt-4 h-11 w-full text-base"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Створити
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
