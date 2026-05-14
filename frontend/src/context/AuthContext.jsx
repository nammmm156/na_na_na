import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiFetch, getToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)

async function readApiErrorMessage(res, fallbackMessage) {
  const text = await res.text()
  const statusGroup = Math.floor(res.status / 100)
  if (statusGroup >= 5 || /<html|bad gateway|nginx/i.test(text)) {
    return 'He thong dang tam thoi gian doan. Vui long thu lai sau.'
  }
  return text || fallbackMessage
}

function readStoredUser() {
  if (!getToken()) {
    localStorage.removeItem('quanlyshop_user')
    return null
  }
  const raw = localStorage.getItem('quanlyshop_user')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    // Force re-login if stored user is missing role (old session)
    if (!parsed.role) {
      localStorage.removeItem('quanlyshop_user')
      localStorage.removeItem('quanlyshop_token')
      return null
    }
    return parsed
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
      throw new Error(await readApiErrorMessage(res, 'Dang nhap that bai'))
    }
    const data = await res.json()
    setToken(data.token)
    const u = { username: data.username, email: data.email, role: data.role }
    localStorage.setItem('quanlyshop_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const googleLogin = useCallback(async (idToken) => {
    const res = await apiFetch('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    })
    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, 'Dang nhap Google that bai'))
    }
    const data = await res.json()
    setToken(data.token)
    const u = { username: data.username, email: data.email, role: data.role }
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
    if (!res.ok) throw new Error(text || 'Dang ky that bai')
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
      isAdmin: user?.role === 'ADMIN',
      login,
      googleLogin,
      register,
      logout,
    }),
    [user, login, googleLogin, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
