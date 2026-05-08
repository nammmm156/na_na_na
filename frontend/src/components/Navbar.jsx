import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { cartItemsCount } = useShop()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <NavLink to="/" className="brand">
          HTShoes
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Sản phẩm
          </NavLink>
          {isAuthenticated && !isAdmin ? (
            <>
              <NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : '')}>
                Giỏ hàng{cartItemsCount ? ` (${cartItemsCount})` : ''}
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
                Lịch sử mua
              </NavLink>
              <NavLink to="/vouchers" className={({ isActive }) => (isActive ? 'active' : '')}>
                Voucher
              </NavLink>
              <NavLink to="/returns" className={({ isActive }) => (isActive ? 'active' : '')}>
                Trả hàng
              </NavLink>
            </>
          ) : null}
          {isAdmin ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/vouchers" className={({ isActive }) => (isActive ? 'active' : '')}>
                Voucher
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="auth-actions">
          {isAuthenticated ? (
            <>
              <span className="user-pill">{user?.username}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-secondary btn-sm">
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
