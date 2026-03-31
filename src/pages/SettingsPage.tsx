import { Settings } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Налаштування" icon={<Settings className="h-5 w-5" />} />
      <div className="p-4">
        <p className="text-muted-foreground">Settings placeholder</p>
      </div>
    </>
  )
}
