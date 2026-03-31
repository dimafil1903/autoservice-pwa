import { ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="Замовлення" icon={<ClipboardList className="h-5 w-5" />} />
      <div className="p-4">
        <p className="text-muted-foreground">Orders placeholder</p>
      </div>
    </>
  )
}
