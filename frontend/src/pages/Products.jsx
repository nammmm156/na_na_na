import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  category: '',
  imageUrl: '',
}

export default function Products() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

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

  return (
    <div className="products-page">
      <header className="page-header">
        <div>
          <h1>Sản phẩm</h1>
          <p className="muted">Xem công khai; thêm / sửa / xóa cần đăng nhập.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>
          Làm mới
        </button>
      </header>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {isAuthenticated ? (
        <section className="card form-card">
          <h2>{editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
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
            <div className="form-actions span-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              {editingId ? (
                <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                  Hủy
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : (
        <p className="muted hint">
          <Link to="/login">Đăng nhập</Link> để quản lý sản phẩm (API yêu cầu JWT cho POST/PUT/DELETE).
        </p>
      )}

      <section className="card">
        {loading ? (
          <p className="muted">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="muted">Chưa có sản phẩm.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>Tồn</th>
                  <th>Danh mục</th>
                  {isAuthenticated ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      {p.description ? (
                        <div className="muted small line-clamp">{p.description}</div>
                      ) : null}
                    </td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{p.stockQuantity ?? '—'}</td>
                    <td>{p.category ?? '—'}</td>
                    {isAuthenticated ? (
                      <td className="actions">
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => startEdit(p)}>
                          Sửa
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>
                          Xóa
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
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
