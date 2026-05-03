import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { fetchProductReviews, postReview } from '../api/reviews.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../utils/format.js'

function parseReviewComment(comment) {
  const text = (comment || '').trim()
  if (!text) return { title: '', body: '' }
  const parts = text.split(/\n\n/)
  if (parts.length >= 2) return { title: parts[0].trim() || 'Đánh giá', body: parts.slice(1).join('\n\n').trim() }
  return { title: 'Đánh giá', body: text }
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, user } = useAuth()
  const { addToCart } = useShop()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [reviewMsg, setReviewMsg] = useState('')
  const [reviewError, setReviewError] = useState('')

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

  useEffect(() => {
    let mounted = true
    async function loadReviews() {
      setReviewsLoading(true)
      try {
        const list = await fetchProductReviews(id)
        if (mounted) setReviews(Array.isArray(list) ? list : [])
      } catch {
        if (mounted) setReviews([])
      } finally {
        if (mounted) setReviewsLoading(false)
      }
    }
    loadReviews()
    return () => {
      mounted = false
    }
  }, [id])
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
  }, [reviews])

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
            {isAuthenticated && !isAdmin ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => addToCart(product, 1)}>
                  + Thêm vào giỏ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigate('/checkout', {
                      state: { mode: 'buyNow', items: [{ ...product, productId: product.id, quantity: 1 }] },
                    })
                  }
                >
                  🛒 Mua ngay
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Đăng nhập để mua
              </Link>
            )}
            <Link to="/" className="btn btn-secondary">
              Tiep tuc mua sam
            </Link>
          </div>
        </div>
      </article>

      <article className="card reviews-card" style={{ marginTop: 16, padding: '1.2rem' }}>
        <header className="page-header compact" style={{ margin: 0 }}>
          <div>
            <h2>Đánh giá</h2>
            <p className="muted">
              {reviews.length ? (
                <>
                  Trung bình <strong>{avgRating.toFixed(1)}/5</strong> · {reviews.length} đánh giá
                </>
              ) : (
                'Chưa có đánh giá nào.'
              )}
            </p>
          </div>
        </header>

        {reviewMsg ? (
          <div className="alert alert-success" style={{ marginTop: 10 }}>
            {reviewMsg}
          </div>
        ) : null}
        {reviewError ? (
          <div className="alert alert-error" style={{ marginTop: 10 }}>
            {reviewError}
          </div>
        ) : null}

        {isAuthenticated && !isAdmin ? (
          <form
            className="form-grid"
            style={{ marginTop: 12 }}
            onSubmit={async (e) => {
              e.preventDefault()
              setReviewMsg('')
              setReviewError('')
              const title = reviewForm.title.trim()
              const body = reviewForm.body.trim()
              const comment = [title, body].filter(Boolean).join('\n\n')
              try {
                await postReview({
                  productId: Number(id),
                  rating: reviewForm.rating,
                  comment,
                })
                setReviewForm({ rating: 5, title: '', body: '' })
                setReviewMsg('Cảm ơn bạn đã đánh giá!')
                const list = await fetchProductReviews(id)
                setReviews(Array.isArray(list) ? list : [])
              } catch (err) {
                setReviewError(err instanceof Error ? err.message : 'Gửi đánh giá thất bại')
              }
            }}
          >
            <label>
              Sao
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tiêu đề
              <input value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} />
            </label>
            <label className="span-2">
              Nội dung
              <textarea
                rows={3}
                value={reviewForm.body}
                onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Chia sẻ trải nghiệm của bạn..."
              />
            </label>
            <div className="form-actions span-2">
              <button type="submit" className="btn btn-primary">
                Gửi đánh giá
              </button>
            </div>
          </form>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            <Link to="/login" className="text-link">
              Đăng nhập
            </Link>{' '}
            để viết đánh giá.
          </p>
        )}

        {reviewsLoading ? (
          <p className="muted" style={{ marginTop: 14 }}>
            Đang tải đánh giá…
          </p>
        ) : reviews.length ? (
          <div className="reviews-stack" style={{ marginTop: 14 }}>
            {reviews.map((r) => {
              const { title, body } = parseReviewComment(r.comment)
              return (
                <div key={r.id} className="review-row">
                  <div className="review-head">
                    <strong>{title || 'Đánh giá'}</strong>
                    <span className="muted small">
                      {r.username} ·{' '}
                      {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(r.createdAt))}
                    </span>
                  </div>
                  <div className="muted small">
                    {'★'.repeat(r.rating || 0)}
                    {'☆'.repeat(5 - (r.rating || 0))}
                  </div>
                  {body ? (
                    <p style={{ marginTop: 8, marginBottom: 0 }}>
                      {body}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}
      </article>
    </section>
  )
}
