import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Products from './pages/Products.jsx'
import './App.css'

function Layout() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="layout">
      <header className="topbar">
        <NavLink to="/" className="brand">
          Quản lý Shop
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Sản phẩm
          </NavLink>
          {isAuthenticated ? (
            <>
              <span className="user-pill">{user?.username}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Đăng nhập</NavLink>
              <NavLink to="/register" className="nav-cta">
                Đăng ký
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <Layout />
}
