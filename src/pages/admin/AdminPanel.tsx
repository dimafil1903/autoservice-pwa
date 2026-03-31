import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { db } from '@/lib/supabase'
import type { Master } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Copy, Link, UserPlus, ShieldBan, ShieldCheck } from 'lucide-react'

const SESSION_KEY = 'as_session'

interface InviteResult {
  token: string
  url: string
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<InviteResult | null>(null)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addingMaster, setAddingMaster] = useState(false)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    masterId: string
    masterName: string
    action: 'block' | 'unblock'
  }>({ open: false, masterId: '', masterName: '', action: 'block' })

  // Check session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) { navigate('/admin', { replace: true }); return }
      const session = JSON.parse(raw)
      if (session.role !== 'admin') { navigate('/admin', { replace: true }); return }
      db.setAuth(session.access_token)
    } catch {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  const loadMasters = useCallback(async () => {
    try {
      const data = await db.getMasters()
      setMasters(data as Master[])
    } catch (e) {
      toast.error('Помилка завантаження майстрів')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMasters()
  }, [loadMasters])

  async function handleGenerateInvite() {
    setGeneratingInvite(true)
    try {
      const result = await db.generateInvite()
      setInvite({ token: result.token, url: result.url })
      toast.success('Invite згенеровано')
    } catch (e) {
      toast.error('Помилка генерації invite')
      console.error(e)
    } finally {
      setGeneratingInvite(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Скопійовано')
  }

  function openConfirm(master: Master, action: 'block' | 'unblock') {
    setConfirmDialog({
      open: true,
      masterId: master.id,
      masterName: master.name || 'Без імені',
      action,
    })
  }

  async function handleConfirmAction() {
    const { masterId, action } = confirmDialog
    const status = action === 'block' ? 'blocked' : 'active'
    try {
      await db.updateMasterStatus(masterId, status)
      setMasters(prev => prev.map(m => m.id === masterId ? { ...m, status } : m))
      toast.success(action === 'block' ? 'Майстра заблоковано' : 'Майстра розблоковано')
    } catch (e) {
      toast.error('Помилка оновлення статусу')
      console.error(e)
    } finally {
      setConfirmDialog(prev => ({ ...prev, open: false }))
    }
  }

  async function handleAddMaster(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddingMaster(true)

    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string || '').trim()
    const phone = (fd.get('phone') as string || '').trim() || null

    if (!name) {
      toast.error("Введіть ім'я")
      setAddingMaster(false)
      return
    }

    try {
      await db.addMaster({ name, phone, status: 'active' })
      toast.success('Майстра додано')
      setSheetOpen(false)
      await loadMasters()
    } catch (e) {
      toast.error('Помилка додавання')
      console.error(e)
    } finally {
      setAddingMaster(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <h1 className="text-lg font-bold">Автосервіс — Адмін</h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleGenerateInvite}
              disabled={generatingInvite}
            >
              {generatingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
              Згенерувати invite
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
              <UserPlus className="h-4 w-4" />
              + Вручну
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 space-y-4">
        {/* Invite result */}
        {invite && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Invite згенеровано:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-background px-2 py-1 text-sm border">
                {invite.url}
              </code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(invite.url)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Токен:</span>
              <code className="rounded bg-background px-2 py-1 text-sm border">{invite.token}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(invite.token)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Masters table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : masters.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">Немає майстрів</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Ім'я</th>
                  <th className="px-3 py-2 text-left font-medium">Телефон</th>
                  <th className="px-3 py-2 text-left font-medium">Статус</th>
                  <th className="px-3 py-2 text-left font-medium">Зареєстрований</th>
                  <th className="px-3 py-2 text-right font-medium">Дії</th>
                </tr>
              </thead>
              <tbody>
                {masters.map(m => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      ...{m.id.slice(-8)}
                    </td>
                    <td className="px-3 py-2">{m.name || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{m.phone || '—'}</td>
                    <td className="px-3 py-2">
                      <Badge
                        className={
                          m.status === 'active'
                            ? 'bg-green-600 text-white'
                            : m.status === 'blocked'
                            ? 'bg-red-600 text-white'
                            : ''
                        }
                      >
                        {m.status === 'active' ? 'Активний' : m.status === 'blocked' ? 'Заблокований' : 'Очікує'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {m.registered_at ? new Date(m.registered_at).toLocaleDateString('uk-UA') : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {m.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openConfirm(m, 'block')}
                        >
                          <ShieldBan className="h-4 w-4" />
                          Блокувати
                        </Button>
                      ) : m.status === 'blocked' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConfirm(m, 'unblock')}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Розблокувати
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Master Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Додати майстра</SheetTitle>
            <SheetDescription>Додайте нового майстра вручну</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAddMaster} className="flex flex-col gap-4 p-4">
            <div className="space-y-1">
              <Label htmlFor="master-name">Ім'я *</Label>
              <Input
                id="master-name"
                name="name"
                type="text"
                placeholder="Ім'я майстра"
                className="h-11 text-base"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="master-phone">Телефон</Label>
              <Input
                id="master-phone"
                name="phone"
                type="tel"
                placeholder="+380..."
                className="h-11 text-base"
              />
            </div>
            <Button type="submit" className="h-11" disabled={addingMaster}>
              {addingMaster && <Loader2 className="h-4 w-4 animate-spin" />}
              Додати
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'block' ? 'Заблокувати майстра?' : 'Розблокувати майстра?'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'block'
                ? `Ви впевнені, що хочете заблокувати "${confirmDialog.masterName}"?`
                : `Ви впевнені, що хочете розблокувати "${confirmDialog.masterName}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              Скасувати
            </Button>
            <Button
              variant={confirmDialog.action === 'block' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
            >
              {confirmDialog.action === 'block' ? 'Заблокувати' : 'Розблокувати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
