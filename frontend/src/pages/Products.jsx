import { useCallback, useEffect, useState } from 'react'
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

  return (
    <div className="products-page">
      <header className="page-header">
        <div>
          <h1>Sản phẩm</h1>
          <p className="muted">
            {isAdmin ? 'Quản lý sản phẩm — thêm, sửa, xóa.' : 'Khám phá các sản phẩm chất lượng cao.'}
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
              Danh mục
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
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
            <h3>Chưa có sản phẩm</h3>
            <p>Hãy thêm sản phẩm đầu tiên!</p>
          </div>
        ) : (
          <div className="products-grid">
            {items.map((p) => (
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
                  <p className="product-category">{p.category || 'General'}</p>
                  <h3>
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                  </h3>
                  <p className="product-description">
                    {p.description || 'Sản phẩm chất lượng cao.'}
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
