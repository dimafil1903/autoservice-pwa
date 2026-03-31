import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wrench, Loader2 } from 'lucide-react'

type Mode = 'login' | 'register' | 'reset'

export default function LoginPage() {
  const { login, register, resetPassword } = useAuth()
  const [params] = useSearchParams()
  const inviteToken = params.get('invite') || ''

  const [mode, setMode] = useState<Mode>(inviteToken ? 'register' : 'login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    if (inviteToken) setMode('register')
  }, [inviteToken])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string || '').trim()
    const password = fd.get('password') as string || ''
    const name = (fd.get('name') as string || '').trim()
    const token = (fd.get('inviteToken') as string || '').trim()

    try {
      if (mode === 'login') {
        const err = await login(email, password)
        if (err) setError(err)
      } else if (mode === 'register') {
        if (!name) { setError("Введіть ім'я"); setLoading(false); return }
        if (!token) { setError('Потрібен invite токен'); setLoading(false); return }
        const err = await register(email, password, name, token)
        if (err) setError(err)
      } else {
        await resetPassword(email)
        setResetSent(true)
      }
    } catch {
      setError("Помилка з'єднання")
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setResetSent(false)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 safe-top safe-bottom">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Wrench className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold">AutoService</h1>
      </div>

      {/* Title */}
      <h2 className="mb-6 text-center text-lg font-semibold">
        {mode === 'login' && 'Вхід'}
        {mode === 'register' && 'Реєстрація'}
        {mode === 'reset' && 'Скидання паролю'}
      </h2>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        {mode === 'register' && (
          <div className="space-y-1">
            <Label htmlFor="name">Ім'я</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ваше ім'я"
              autoComplete="name"
              className="h-11 text-base"
              required
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            className="h-11 text-base"
            required
          />
        </div>

        {mode !== 'reset' && (
          <div className="space-y-1">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Пароль"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="h-11 text-base"
              minLength={6}
              required
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-1">
            <Label htmlFor="inviteToken">Invite токен</Label>
            <Input
              id="inviteToken"
              name="inviteToken"
              type="text"
              defaultValue={inviteToken}
              placeholder="INV-XXXXXXXX"
              className="h-11 text-base"
              required
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {resetSent && (
          <p className="text-sm text-green-600">
            Лист для скидання паролю відправлено на вашу пошту
          </p>
        )}

        <Button
          type="submit"
          className="!mt-4 h-11 w-full text-base"
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'login' && 'Увійти'}
          {mode === 'register' && 'Зареєструватися'}
          {mode === 'reset' && 'Надіслати лист'}
        </Button>
      </form>

      {/* Mode switches */}
      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        {mode === 'login' && (
          <>
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className="text-muted-foreground underline-offset-2 hover:underline"
            >
              Забули пароль?
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="text-primary underline-offset-2 hover:underline"
            >
              Є invite? Зареєструватися
            </button>
          </>
        )}
        {mode === 'register' && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="text-primary underline-offset-2 hover:underline"
          >
            Вже є акаунт? Увійти
          </button>
        )}
        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="text-primary underline-offset-2 hover:underline"
          >
            Повернутися до входу
          </button>
        )}
      </div>
    </div>
  )
}
