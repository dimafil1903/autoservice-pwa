import { Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

export default function FinancePage() {
  return (
    <>
      <PageHeader title="Фінанси" icon={<Wallet className="h-5 w-5" />} />
      <div className="p-4">
        <p className="text-muted-foreground">Finance placeholder</p>
      </div>
    </>
  )
}
