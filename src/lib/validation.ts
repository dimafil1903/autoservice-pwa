import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(1, "Введіть ім'я"),
  phone: z.string().optional().transform(v => v || null),
})

export const carSchema = z.object({
  client_id: z.string(),
  brand: z.string().min(1, 'Введіть марку'),
  model: z.string().min(1, 'Введіть модель'),
  year: z.union([z.coerce.number().int().min(1960).max(2030), z.literal('').transform(() => null)]).optional().default(null),
  plate: z.string().optional().transform(v => v || null),
  vin: z.string().optional().transform(v => v || null),
  color: z.string().optional().transform(v => v || null),
})

export const orderSchema = z.object({
  car_id: z.string().min(1, 'Оберіть авто'),
  problem: z.string().min(1, 'Опишіть проблему'),
  mileage: z.union([z.coerce.number().int().positive(), z.literal('').transform(() => null)]).optional().default(null),
  date_in: z.string().optional().transform(v => v || null),
})

export const orderItemSchema = z.object({
  order_id: z.string(),
  type: z.enum(['work', 'part']),
  name: z.string().min(1, 'Введіть назву'),
  qty: z.coerce.number().positive('Кількість > 0'),
  unit: z.string().default('шт'),
  price: z.coerce.number().min(0, 'Ціна >= 0'),
})

export const financeSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Сума > 0'),
  category: z.string().optional().transform(v => v || null),
  date: z.string().min(1, 'Вкажіть дату'),
  comment: z.string().optional().transform(v => v || null),
})

export const masterSchema = z.object({
  name: z.string().min(1, "Введіть ім'я"),
  phone: z.string().optional().transform(v => v || null),
})

export type ClientInput = z.infer<typeof clientSchema>
export type CarInput = z.infer<typeof carSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
export type FinanceInput = z.infer<typeof financeSchema>
export type MasterInput = z.infer<typeof masterSchema>
