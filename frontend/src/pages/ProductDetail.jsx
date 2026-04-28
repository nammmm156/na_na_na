import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { formatPrice } from '../utils/format.js'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadDetail() {
      setLoading(true)
      try {
        const res = await apiFetch(`/api/products/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (mounted) setProduct(data)
        } else if (mounted) {
          setProduct(null)
        }
      } catch {
        if (mounted) setProduct(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDetail()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return (
      <section className="detail-page">
        <div className="card detail-skeleton" />
      </section>
    )
  }

  if (!product) {
    return (
      <section className="detail-page">
        <article className="empty-state">
          <h2>Khong tim thay san pham</h2>
          <Link to="/" className="btn btn-primary">
            Quay lai danh sach
          </Link>
        </article>
      </section>
    )
  }

  return (
    <section className="detail-page">
      <article className="detail-card">
        <div className="detail-media">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80'}
            alt={product.name}
          />
        </div>
        <div className="detail-content">
          <p className="product-category">{product.category || 'General'}</p>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.description || 'San pham chat luong cao, giao hang toan quoc.'}</p>
          <strong className="detail-price">{formatPrice(product.price)}</strong>
          <div className="detail-actions">
            <button type="button" className="btn btn-primary">
              Them vao gio
            </button>
            <Link to="/" className="btn btn-secondary">
              Tiep tuc mua sam
            </Link>
          </div>
        </div>
      </article>
    </section>
  )
}
