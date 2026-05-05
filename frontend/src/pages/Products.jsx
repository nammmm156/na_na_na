import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  category: '',
  imageUrl: '',
}

const fallbackImage =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'

function norm(s) {
  return (s || '').toLowerCase()
}

function productMatchesNav(p, navKey) {
  const cat = norm(p.category)
  switch (navKey) {
    case 'all':
      return true
    case 'nike':
      return cat.includes('nike')
    case 'adidas':
      return cat.includes('adidas')
    case 'lacoste':
      return cat.includes('lacoste')
    case 'puma':
      return cat.includes('puma')
    default:
      return true
  }
}

function productMatchesSearch(p, q) {
  const needle = norm(q).trim()
  if (!needle) return true
  return (
    norm(p.name).includes(needle) ||
    norm(p.description).includes(needle) ||
    norm(p.category).includes(needle)
  )
}

export default function Products() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin } = useAuth()
  const { addToCart } = useShop()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [shoeNav, setShoeNav] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/products')
      if (!res.ok) throw new Error(await res.text())
      setItems(await res.json())
    } catch (e) {
      setError(e.message || 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      price: p.price != null ? String(p.price) : '',
      stockQuantity: p.stockQuantity != null ? String(p.stockQuantity) : '',
      category: p.category ?? '',
      imageUrl: p.imageUrl ?? '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(false)
  }

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const body = {
      name: form.name,
      description: form.description || null,
      price: form.price === '' ? null : Number(form.price),
      stockQuantity: form.stockQuantity === '' ? null : parseInt(form.stockQuantity, 10),
      category: form.category || null,
      imageUrl: form.imageUrl || null,
    }
    try {
      if (editingId) {
        const res = await apiFetch(`/api/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error((await res.text()) || 'Cập nhật thất bại')
      } else {
        const res = await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error((await res.text()) || 'Thêm thất bại')
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(err.message || 'Lỗi')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Xóa sản phẩm này?')) return
    setError('')
    try {
      const res = await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error(await res.text())
      if (editingId === id) cancelEdit()
      await load()
    } catch (err) {
      setError(err.message || 'Xóa thất bại')
    }
  }

  function handleAddToCart(product) {
    addToCart(product, 1)
  }

  function handleBuyNow(product) {
    navigate('/checkout', {
      state: {
        mode: 'buyNow',
        items: [{ ...product, productId: product.id, quantity: 1 }],
      },
    })
  }

  const filteredItems = useMemo(
    () => items.filter((p) => productMatchesNav(p, shoeNav) && productMatchesSearch(p, searchQuery)),
    [items, shoeNav, searchQuery],
  )

  return (
    <div className="products-page">
      <header className="page-header">
        <div>
          <h1>Sản phẩm</h1>
          <p className="muted">
            {isAdmin
              ? 'Hãy để chúng tôi giúp đôi chân của bạn chắc chắn trên từng bước đi!'
              : 'Chọn thương hiệu hoặc tìm kiếm để xem giày phù hợp.'}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            ↻ Làm mới
          </button>
          {isAdmin && !showForm ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>
              + Thêm sản phẩm
            </button>
          ) : null}
        </div>
      </header>

      <nav className="shoe-category-bar" aria-label="Danh mục giày theo thương hiệu">
        <div className="shoe-category-inner">
          <ul className="shoe-category-list">
            <li>
              <button
                type="button"
                className={`shoe-nav-btn${shoeNav === 'all' ? ' active' : ''}`}
                onClick={() => setShoeNav('all')}
              >
                Tất cả
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`shoe-nav-btn${shoeNav === 'nike' ? ' active' : ''}`}
                onClick={() => setShoeNav('nike')}
              >
                Giày Nike
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`shoe-nav-btn${shoeNav === 'adidas' ? ' active' : ''}`}
                onClick={() => setShoeNav('adidas')}
              >
                Giày Adidas
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`shoe-nav-btn${shoeNav === 'lacoste' ? ' active' : ''}`}
                onClick={() => setShoeNav('lacoste')}
              >
                Giày Lacoste
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`shoe-nav-btn${shoeNav === 'puma' ? ' active' : ''}`}
                onClick={() => setShoeNav('puma')}
              >
                Giày Puma
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="product-toolbar">
        <label className="product-search">
          Tìm kiếm
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tên giày, mô tả, danh mục…"
            autoComplete="off"
          />
        </label>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {/* Admin Form */}
      {isAdmin && showForm ? (
        <section className="card form-card">
          <h2>{editingId ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Tên *
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Giá *
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </label>
            <label className="span-2">
              Mô tả
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label>
              Tồn kho
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
              />
            </label>
            <label>
              Danh mục / thương hiệu
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="VD: Giày Nike, Giày Adidas…"
              />
            </label>
            <label className="span-2">
              URL ảnh
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </label>
            {form.imageUrl ? (
              <div className="span-2 form-preview">
                <img src={form.imageUrl} alt="Preview" onError={(e) => { e.target.style.display = 'none' }} />
              </div>
            ) : null}
            <div className="form-actions span-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Hủy
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Product Grid */}
      <section>
        {loading ? (
          <div className="products-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>Chưa có giày trong kho</h3>
            <p>Hãy thêm sản phẩm đầu tiên!</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>Không tìm thấy giày phù hợp</h3>
            <p>Thử đổi thương hiệu hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredItems.map((p) => (
              <article key={p.id} className="product-card">
                <Link to={`/products/${p.id}`} className="product-media">
                  <img
                    src={p.imageUrl || fallbackImage}
                    alt={p.name}
                    loading="lazy"
                    onError={(e) => { e.target.src = fallbackImage }}
                  />
                </Link>
                <div className="product-content">
                  <p className="product-category">{p.category || 'Giày'}</p>
                  <h3>
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                  </h3>
                  <p className="product-description">
                    {p.description || 'Giày chính hãng, đi êm bền.'}
                  </p>
                  <div className="product-footer">
                    <strong className="product-price">{formatPrice(p.price)}</strong>
                    {isAdmin ? (
                      <span className="product-stock">
                        Kho: {p.stockQuantity ?? 0}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="product-actions">
                  {isAuthenticated && !isAdmin ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm btn-full"
                        onClick={() => handleAddToCart(p)}
                      >
                        + Thêm vào giỏ
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-full"
                        onClick={() => handleBuyNow(p)}
                      >
                        🛒 Mua ngay
                      </button>
                    </>
                  ) : null}
                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm btn-full"
                        onClick={() => startEdit(p)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm btn-full"
                        onClick={() => handleDelete(p.id)}
                      >
                        🗑️ Xóa
                      </button>
                    </>
                  ) : null}
                  {!isAuthenticated ? (
                    <Link to="/login" className="btn btn-secondary btn-sm btn-full">
                      Đăng nhập để mua
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function formatPrice(v) {
  if (v == null) return '—'
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v))
  } catch {
    return String(v)
  }
}
