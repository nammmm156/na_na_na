import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client.js'
import ProductCard from '../components/ProductCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { sampleProducts } from '../data/sampleProducts.js'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  category: '',
  imageUrl: '',
}

export default function Products() {
  const { isAuthenticated, isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/products')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setItems(Array.isArray(data) && data.length ? data : sampleProducts)
    } catch (e) {
      setItems(sampleProducts)
      setError('')
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
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
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

  const categories = useMemo(() => {
    const fromItems = [...items, ...sampleProducts]
      .map((item) => item.category)
      .filter(Boolean)
      .map((item) => item.toLowerCase())
    return ['all', ...new Set(fromItems)]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const bySearch = item.name.toLowerCase().includes(search.toLowerCase())
      const byCategory = category === 'all' || (item.category || '').toLowerCase() === category
      const price = Number(item.price || 0)
      const byPrice =
        priceFilter === 'all' ||
        (priceFilter === 'low' && price < 5000000) ||
        (priceFilter === 'mid' && price >= 5000000 && price <= 15000000) ||
        (priceFilter === 'high' && price > 15000000)
      return bySearch && byCategory && byPrice
    })
  }, [items, search, category, priceFilter])

  const canManage = isAuthenticated && isAdmin

  return (
    <div className="products-page">
      <section className="hero card">
        <div>
          <h1>Discover the best products for you</h1>
          <p>High quality products with a modern shopping experience.</p>
          {/* TODO: Add hero banner image here (e.g. lifestyle tech setup from Unsplash) */}
        </div>
        <img
          src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1400&q=80"
          alt="Hero banner"
        />
      </section>

      <header className="page-header compact">
        <h2>Featured Products</h2>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          Lam moi
        </button>
      </header>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="toolbar card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          placeholder="Search products..."
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'All categories' : item}
            </option>
          ))}
        </select>
        <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
          <option value="all">All prices</option>
          <option value="low">Below 5M</option>
          <option value="mid">5M - 15M</option>
          <option value="high">Above 15M</option>
        </select>
      </section>

      {canManage ? (
        <section className="card form-card">
          <h3>{editingId ? 'Cap nhat san pham' : 'Them san pham moi'}</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Ten *
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Gia *
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
              Mo ta
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label>
              Ton kho
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
              />
            </label>
            <label>
              Danh muc
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </label>
            <label className="span-2">
              URL anh
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </label>
            <div className="form-actions span-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Cap nhat' : 'Them moi'}
              </button>
              {editingId ? (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  Huy
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      <section className="card">
        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="skeleton-card" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>Khong co ket qua phu hop</h3>
            <p>Thu doi tu khoa tim kiem hoac bo loc.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredItems.map((p) => (
              <div key={p.id} className="product-grid-item">
                <ProductCard product={p} />
                {canManage ? (
                  <div className="product-admin-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}>
                      Sua
                    </button>
                    {!String(p.id).startsWith('sample-') ? (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                        Xoa
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
