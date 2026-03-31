import { Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

export default function ClientsPage() {
  return (
    <>
      <PageHeader title="Клієнти" icon={<Users className="h-5 w-5" />} />
      <div className="p-4">
        <p className="text-muted-foreground">Clients placeholder</p>
      </div>
    </>
  )
}
