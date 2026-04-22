const TOKEN_KEY = 'quanlyshop_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Base URL: empty in dev uses Vite proxy; set VITE_API_URL for direct calls */
function apiBase() {
  const env = import.meta.env.VITE_API_URL
  if (env) return env.replace(/\/$/, '')
  return ''
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${apiBase()}${path}`, { ...options, headers })
  return res
}
