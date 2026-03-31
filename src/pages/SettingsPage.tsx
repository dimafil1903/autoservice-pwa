import { useState } from 'react'
import { Settings, Wifi, LogOut, Loader2, Save } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { db } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'

const FOP_KEYS = ['fopName', 'fopIpn', 'fopAddress', 'fopPhone', 'fopCity'] as const

const FOP_LABELS: Record<(typeof FOP_KEYS)[number], string> = {
  fopName: "Ім'я ФОП",
  fopIpn: 'ІПН',
  fopAddress: 'Адреса',
  fopPhone: 'Телефон',
  fopCity: 'Місто',
}

const FOP_PLACEHOLDERS: Record<(typeof FOP_KEYS)[number], string> = {
  fopName: 'ФОП Іваненко І.І.',
  fopIpn: '1234567890',
  fopAddress: 'вул. Центральна, 1',
  fopPhone: '+380501234567',
  fopCity: 'Київ',
}

function loadFopData() {
  const data: Record<string, string> = {}
  for (const key of FOP_KEYS) {
    data[key] = localStorage.getItem(key) || ''
  }
  return data
}

export default function SettingsPage() {
  const { logout } = useAuth()
  const [fop, setFop] = useState(loadFopData)
  const [pinging, setPinging] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleChange(key: string, value: string) {
    setFop((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setSaving(true)
    for (const key of FOP_KEYS) {
      localStorage.setItem(key, fop[key] || '')
    }
    setTimeout(() => {
      setSaving(false)
      toast.success('Налаштування збережено')
    }, 200)
  }

  async function handlePing() {
    setPinging(true)
    try {
      const result = await db.ping()
      if (result.ok) {
        toast.success("З'єднання працює")
      } else {
        toast.error("Немає з'єднання")
      }
    } catch {
      toast.error("Помилка з'єднання")
    } finally {
      setPinging(false)
    }
  }

  function handleLogout() {
    if (window.confirm('Ви впевнені, що хочете вийти?')) {
      logout()
    }
  }

  return (
    <>
      <PageHeader title="Налаштування" icon={<Settings className="h-5 w-5" />} />

      <div className="p-4 space-y-4 pb-8">
        {/* FOP Data */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Дані ФОП (для актів)</h3>

          {FOP_KEYS.map((key) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{FOP_LABELS[key]}</Label>
              <Input
                id={key}
                placeholder={FOP_PLACEHOLDERS[key]}
                className="h-11 text-base"
                value={fop[key]}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            </div>
          ))}

          <Button
            className="!mt-4 h-11 w-full gap-2 text-base"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Зберегти
          </Button>
        </div>

        <Separator />

        {/* Connection test */}
        <Button
          variant="outline"
          className="h-11 w-full gap-2 text-base"
          onClick={handlePing}
          disabled={pinging}
        >
          {pinging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          Перевірити з'єднання
        </Button>

        {/* Logout */}
        <Button
          variant="destructive"
          className="h-11 w-full gap-2 text-base"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Вийти
        </Button>
      </div>
    </>
  )
}
