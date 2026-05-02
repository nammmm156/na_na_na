import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const msg = await register({ username, email, password })
      setSuccess(msg)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setLoading(true)
    try {
      await googleLogin(credentialResponse.credential)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Google Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google Login failed')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="muted">Join QuanlyShop today</p>
        <form onSubmit={handleSubmit} className="form-stack">
          {error ? <div className="alert alert-error">{error}</div> : null}
          {success ? <div className="alert alert-success">{success}</div> : null}
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={50}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password (minimum 6 chars)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '100%', borderBottom: '1px solid #ddd', height: '10px', textAlign: 'center' }}>
            <span style={{ backgroundColor: '#fff', padding: '0 10px', color: '#666' }}>OR</span>
          </div>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
          />
        </div>

        <p className="muted small">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
