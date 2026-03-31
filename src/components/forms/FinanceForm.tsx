import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { financeSchema, type FinanceInput } from '@/lib/validation'
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

interface FinanceFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: FinanceInput) => Promise<void>
}

export function FinanceForm({ open, onClose, onSave }: FinanceFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FinanceInput>({
    resolver: zodResolver(financeSchema) as any,
    defaultValues: {
      type: 'income',
      amount: '' as any,
      category: '',
      date: new Date().toISOString().split('T')[0],
      comment: '',
    },
  })

  async function onSubmit(data: FinanceInput) {
    await onSave(data)
    reset({
      type: 'income',
      amount: '' as any,
      category: '',
      date: new Date().toISOString().split('T')[0],
      comment: '',
    })
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
          <SheetTitle>Нова транзакція</SheetTitle>
          <SheetDescription>Додайте дохід або витрату</SheetDescription>
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
                    <SelectItem value="income">Дохід</SelectItem>
                    <SelectItem value="expense">Витрата</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="finance-amount">Сума (грн) *</Label>
            <Input
              id="finance-amount"
              type="number"
              step="any"
              placeholder="0"
              className="h-11 text-base"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Категорія</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 w-full text-base">
                    <SelectValue placeholder="Оберіть категорію" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ремонт">Ремонт</SelectItem>
                    <SelectItem value="Запчастини">Запчастини</SelectItem>
                    <SelectItem value="Оренда">Оренда</SelectItem>
                    <SelectItem value="Інструменти">Інструменти</SelectItem>
                    <SelectItem value="Зарплата">Зарплата</SelectItem>
                    <SelectItem value="Інше">Інше</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="finance-date">Дата *</Label>
            <Input
              id="finance-date"
              type="date"
              className="h-11 text-base"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="finance-comment">Коментар</Label>
            <Input
              id="finance-comment"
              placeholder="Коментар"
              className="h-11 text-base"
              {...register('comment')}
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
