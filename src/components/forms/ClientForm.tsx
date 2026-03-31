import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, type ClientInput } from '@/lib/validation'
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

interface ClientFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: ClientInput) => Promise<void>
}

export function ClientForm({ open, onClose, onSave }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', phone: '' },
  })

  async function onSubmit(data: ClientInput) {
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
          <SheetTitle>Новий клієнт</SheetTitle>
          <SheetDescription>Заповніть дані клієнта</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 pb-4">
          <div className="space-y-1">
            <Label htmlFor="client-name">Ім'я *</Label>
            <Input
              id="client-name"
              placeholder="Ім'я клієнта"
              className="h-11 text-base"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="client-phone">Телефон</Label>
            <Input
              id="client-phone"
              type="tel"
              placeholder="+380..."
              className="h-11 text-base"
              {...register('phone')}
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
