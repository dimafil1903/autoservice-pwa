import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { db } from './supabase'
import type { Session } from './types'

const SESSION_KEY = 'as_session'
const SESSION_DAYS = 30

interface AuthContextType {
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (email: string, password: string, name: string, inviteToken: string) => Promise<string | null>
  logout: () => void
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

function saveSession(data: Record<string, any>): Session {
  const session: Session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: data.user?.id || data.user_id,
    email: data.user?.email || data.email,
    role: data.user?.user_metadata?.role || data.role || 'master',
    master_id: data.user?.user_metadata?.master_id || data.master_id || null,
    expires_at: Date.now() + SESSION_DAYS * 24 * 3600 * 1000,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

function loadSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

function isExpired(session: Session) {
  return !session.expires_at || Date.now() > session.expires_at - 5 * 60 * 1000
}

async function refreshToken(token: string): Promise<Session | null> {
  try {
    const res = await fetch(`${db.getUrl()}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: db.getKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return saveSession(data)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(async (s: Session) => {
    db.setAuth(s.access_token)

    let masterId = s.master_id
    if (!masterId && s.role !== 'admin') {
      try {
        const masters = await db.get<{ id: string }>('masters', { user_id: `eq.${s.user_id}` })
        masterId = masters[0]?.id || null
      } catch {
        // ignore
      }
    }

    if (masterId) {
      db.setMaster(masterId)
      if (!s.master_id) {
        s = { ...s, master_id: masterId }
        localStorage.setItem(SESSION_KEY, JSON.stringify(s))
      }
    }

    setSession(s)
  }, [])

  useEffect(() => {
    ;(async () => {
      const stored = loadSession()
      if (!stored) {
        setLoading(false)
        return
      }

      if (isExpired(stored)) {
        const refreshed = await refreshToken(stored.refresh_token)
        if (refreshed) {
          await applySession(refreshed)
        } else {
          localStorage.removeItem(SESSION_KEY)
          db.setAuth(null)
        }
        setLoading(false)
        return
      }

      await applySession(stored)
      setLoading(false)
    })()
  }, [applySession])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${db.getUrl()}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: db.getKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return data.error_description || data.msg || 'Невірний логін або пароль'
      }

      const s = saveSession(data)
      await applySession(s)
      return null
    } catch {
      return "Помилка з'єднання"
    }
  }, [applySession])

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    inviteToken: string,
  ): Promise<string | null> => {
    try {
      // Check invite
      const invite = await db.get<{ id: string }>('invites', {
        token: `eq.${inviteToken}`,
        status: 'eq.pending',
      })
      if (!invite.length) {
        return 'Невірний або використаний invite токен'
      }

      // Register in Supabase Auth
      const res = await fetch(`${db.getUrl()}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: db.getKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          data: { role: 'master', name, invite_token: inviteToken },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        return data.msg || data.error_description || 'Помилка реєстрації'
      }

      // Set JWT before DB operations (RLS needs auth.uid())
      db.setAuth(data.access_token)

      // Create master in DB
      const master = await db.addMaster({
        name,
        invite_token: inviteToken,
        user_id: data.user?.id,
        status: 'active',
      })

      // Mark invite as used
      await db.patch('invites', invite[0].id, {
        status: 'used',
        master_id: master.id,
        used_at: new Date().toISOString(),
      })

      const s = saveSession({ ...data, master_id: master.id, role: 'master' })
      await applySession(s)
      return null
    } catch (e) {
      return 'Помилка: ' + (e instanceof Error ? e.message : String(e))
    }
  }, [applySession])

  const logout = useCallback(() => {
    const stored = loadSession()
    if (stored?.access_token) {
      fetch(`${db.getUrl()}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: db.getKey(),
          Authorization: `Bearer ${stored.access_token}`,
        },
      }).catch(() => {})
    }
    localStorage.removeItem(SESSION_KEY)
    db.setAuth(null)
    db.setMaster(null)
    setSession(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await fetch(`${db.getUrl()}/auth/v1/recover`, {
      method: 'POST',
      headers: { apikey: db.getKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
