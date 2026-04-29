import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../utils/format.js'

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function Orders() {
  const { orders } = useShop()
  const location = useLocation()
  const navigate = useNavigate()
  const highlightOrderId = location.state?.highlightOrderId

  return (
    <section className="orders-page">
      <header className="page-header compact">
        <div>
          <h2>Lịch sử mua hàng</h2>
          <p className="muted">Các đơn hàng được tạo từ trang thanh toán (frontend-only).</p>
        </div>
        <div className="header-actions">
          <Link to="/cart" className="btn btn-secondary btn-sm">
            Giỏ hàng
          </Link>
          <Link to="/returns" className="btn btn-secondary btn-sm">
            Trả hàng
          </Link>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có đơn hàng</h3>
          <p>Hãy mua một sản phẩm để bắt đầu.</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/" className="btn btn-primary">
              Xem sản phẩm
            </Link>
          </div>
        </div>
      ) : (
        <div className="orders-stack">
          {orders.map((o) => (
            <article key={o.id} className={`card order-card${highlightOrderId === o.id ? ' highlight' : ''}`}>
              <header className="order-head">
                <div>
                  <div className="muted small">Mã đơn</div>
                  <strong>{o.id}</strong>
                </div>
                <div>
                  <div className="muted small">Ngày</div>
                  <strong>{formatDate(o.createdAt)}</strong>
                </div>
                <div>
                  <div className="muted small">Trạng thái</div>
                  <strong>{o.status}</strong>
                </div>
                <div>
                  <div className="muted small">Tổng</div>
                  <strong>{formatPrice(o.pricing?.total ?? 0)}</strong>
                </div>
              </header>

              <div className="order-body">
                <div className="order-items">
                  {(o.items || []).map((it) => (
                    <div key={`${o.id}:${it.productId}`} className="order-item">
                      <div className="checkout-prod">
                        <img
                          className="cart-thumb"
                          src={
                            it.imageUrl ||
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={it.name}
                        />
                        <div>
                          <div className="cart-name">{it.name}</div>
                          <div className="muted small">
                            {formatPrice(it.price)} × {it.quantity}
                          </div>
                        </div>
                      </div>
                      <strong>{formatPrice((it.price || 0) * (it.quantity || 0))}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-meta">
                  <div className="summary-row">
                    <span className="muted">Tạm tính</span>
                    <strong>{formatPrice(o.pricing?.subtotal ?? 0)}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="muted">Giảm giá</span>
                    <strong>{formatPrice(o.pricing?.discount ?? 0)}</strong>
                  </div>
                  <div className="summary-row total">
                    <span>Tổng</span>
                    <strong>{formatPrice(o.pricing?.total ?? 0)}</strong>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate('/returns', { state: { orderId: o.id } })}
                    >
                      Yêu cầu trả hàng
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

