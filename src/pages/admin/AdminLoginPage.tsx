import { useState } from 'react'
import { useNavigate } from 'react-router'
import { db } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Loader2 } from 'lucide-react'

const SESSION_KEY = 'as_session'
const SESSION_DAYS = 30

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string || '').trim()
    const password = fd.get('password') as string || ''

    try {
      const res = await fetch(`${db.getUrl()}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: db.getKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error_description || data.msg || 'Невірний логін або пароль')
        setLoading(false)
        return
      }

      // Check admin role
      if (data.user?.user_metadata?.role !== 'admin') {
        setError('Немає прав адміна')
        setLoading(false)
        return
      }

      // Save session
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_id: data.user.id,
        email: data.user.email,
        role: 'admin' as const,
        master_id: null,
        expires_at: Date.now() + SESSION_DAYS * 24 * 3600 * 1000,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      db.setAuth(data.access_token)

      navigate('/admin/panel', { replace: true })
    } catch {
      setError("Помилка з'єднання")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold">Адмін панель</h1>
      </div>

      <h2 className="mb-6 text-center text-lg font-semibold">Вхід</h2>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@example.com"
            autoComplete="email"
            className="h-11 text-base"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Пароль"
            autoComplete="current-password"
            className="h-11 text-base"
            minLength={6}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="!mt-4 h-11 w-full text-base" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Увійти
        </Button>
      </form>
    </div>
  )
}
