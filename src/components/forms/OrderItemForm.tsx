import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderItemSchema, type OrderItemInput } from '@/lib/validation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface OrderItemFormProps {
  open: boolean
  orderId: string
  onClose: () => void
  onSave: (data: OrderItemInput) => Promise<void>
}

export function OrderItemForm({ open, orderId, onClose, onSave }: OrderItemFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderItemInput & { total: number }>({
    resolver: zodResolver(orderItemSchema),
    defaultValues: {
      order_id: orderId,
      type: 'work',
      name: '',
      qty: 1,
      unit: 'шт',
      price: 0,
      total: 0,
    },
  })

  const qty = watch('qty')
  const price = watch('price')

  useEffect(() => {
    const total = (parseFloat(String(qty)) || 0) * (parseFloat(String(price)) || 0)
    setValue('total', Math.round(total * 100) / 100)
  }, [qty, price, setValue])

  async function onSubmit(data: OrderItemInput) {
    await onSave({ ...data, order_id: orderId })
    reset({ order_id: orderId, type: 'work', name: '', qty: 1, unit: 'шт', price: 0, total: 0 })
    onClose()
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      reset({ order_id: orderId, type: 'work', name: '', qty: 1, unit: 'шт', price: 0, total: 0 })
      onClose()
    }
  }

  const total = watch('total')

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <SheetHeader className="pb-2">
          <SheetTitle>Нова позиція</SheetTitle>
          <SheetDescription>Додайте роботу або запчастину</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 pb-4">
          <div className="space-y-1">
            <Label>Тип *</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 w-full text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Робота</SelectItem>
                    <SelectItem value="part">Запчастина</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="item-name">Назва *</Label>
            <Input
              id="item-name"
              placeholder="Назва роботи або запчастини"
              className="h-11 text-base"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="item-qty">Кількість</Label>
              <Input
                id="item-qty"
                type="number"
                step="any"
                className="h-11 text-base"
                {...register('qty')}
              />
              {errors.qty && (
                <p className="text-xs text-destructive">{errors.qty.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Одиниця</Label>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="шт">шт</SelectItem>
                      <SelectItem value="год">год</SelectItem>
                      <SelectItem value="к-т">к-т</SelectItem>
                      <SelectItem value="л">л</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="item-price">Ціна (грн)</Label>
              <Input
                id="item-price"
                type="number"
                step="any"
                className="h-11 text-base"
                {...register('price')}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Сума (грн)</Label>
              <Input
                type="number"
                className="h-11 text-base bg-muted"
                value={total || 0}
                readOnly
              />
            </div>
          </div>

          <Button
            type="submit"
            className="!mt-4 h-11 w-full text-base"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Додати
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
