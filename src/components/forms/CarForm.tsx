import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { carSchema, type CarInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Loader2 } from 'lucide-react'

interface CarFormProps {
  open: boolean
  clientId: string
  onClose: () => void
  onSave: (data: CarInput) => Promise<void>
}

export function CarForm({ open, clientId, onClose, onSave }: CarFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarInput>({
    resolver: zodResolver(carSchema) as any,
    defaultValues: {
      client_id: clientId,
      brand: '',
      model: '',
      year: '' as any,
      plate: '',
      vin: '',
      color: '',
    },
  })

  async function onSubmit(data: CarInput) {
    await onSave({ ...data, client_id: clientId })
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
          <SheetTitle>Нове авто</SheetTitle>
          <SheetDescription>Додайте автомобіль клієнта</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="car-brand">Марка *</Label>
              <Input
                id="car-brand"
                placeholder="Toyota"
                className="h-11 text-base"
                {...register('brand')}
              />
              {errors.brand && (
                <p className="text-xs text-destructive">{errors.brand.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="car-model">Модель *</Label>
              <Input
                id="car-model"
                placeholder="Camry"
                className="h-11 text-base"
                {...register('model')}
              />
              {errors.model && (
                <p className="text-xs text-destructive">{errors.model.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="car-year">Рік</Label>
              <Input
                id="car-year"
                type="number"
                placeholder="2020"
                className="h-11 text-base"
                {...register('year')}
              />
              {errors.year && (
                <p className="text-xs text-destructive">{errors.year.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="car-color">Колір</Label>
              <Input
                id="car-color"
                placeholder="Білий"
                className="h-11 text-base"
                {...register('color')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="car-plate">Номерний знак</Label>
            <Input
              id="car-plate"
              placeholder="AA 1234 BB"
              className="h-11 text-base"
              {...register('plate')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="car-vin">VIN</Label>
            <Input
              id="car-vin"
              placeholder="VIN код"
              className="h-11 text-base"
              {...register('vin')}
            />
          </div>

          <Button
            type="submit"
            className="!mt-4 h-11 w-full text-base"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Зберегти
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
