import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiFetch, getToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)

function readStoredUser() {
  if (!getToken()) {
    localStorage.removeItem('quanlyshop_user')
    return null
  }
  const raw = localStorage.getItem('quanlyshop_user')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const guessedRole = parsed?.username === 'admin' ? 'admin' : 'user'
    return { ...parsed, role: (parsed?.role || guessedRole).toLowerCase() }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())

  const login = useCallback(async (username, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Đăng nhập thất bại')
    }
    const data = await res.json()
    setToken(data.token)
    const inferredRole = (data.username || username) === 'admin' ? 'admin' : 'user'
    const resolvedRole = data.role || data.roles?.[0] || inferredRole
    const u = {
      username: data.username || username,
      email: data.email || '',
      role: typeof resolvedRole === 'string' ? resolvedRole.toLowerCase() : 'user',
    }
    localStorage.setItem('quanlyshop_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (payload) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    if (!res.ok) throw new Error(text || 'Đăng ký thất bại')
    return text
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem('quanlyshop_user')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(getToken()),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
