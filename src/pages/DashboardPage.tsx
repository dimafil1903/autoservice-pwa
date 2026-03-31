import { Home } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Головна" icon={<Home className="h-5 w-5" />} />
      <div className="p-4">
        <p className="text-muted-foreground">Dashboard placeholder</p>
      </div>
    </>
  )
}
