import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, pricing, setQuantity, removeFromCart, setVoucherCode, applyVoucher } = useShop()

  const items = cart.items || []

  return (
    <section className="cart-page">
      <header className="page-header compact">
        <div>
          <h2>Giỏ hàng</h2>
          <p className="muted">Xem lại sản phẩm, áp voucher, và thanh toán.</p>
        </div>
        <div className="header-actions">
          <Link to="/" className="btn btn-secondary btn-sm">
            Tiếp tục mua
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={items.length === 0}
            onClick={() => navigate('/checkout')}
          >
            Thanh toán
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>Giỏ hàng đang trống</h3>
          <p>Hãy thêm sản phẩm vào giỏ để bắt đầu.</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/" className="btn btn-primary">
              Xem sản phẩm
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-grid">
          <article className="card cart-items">
            <div className="cart-items-header">
              <strong>Sản phẩm</strong>
              <span className="muted">Số lượng</span>
              <span className="muted">Tạm tính</span>
              <span />
            </div>

            {items.map((it) => (
              <div key={it.productId} className="cart-row">
                <div className="cart-prod">
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
                    <div className="muted small">{formatPrice(it.price)}</div>
                  </div>
                </div>

                <div className="cart-qty">
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => setQuantity(it.productId, e.target.value)}
                  />
                </div>

                <div className="cart-line-total">
                  <strong>{formatPrice(Number(it.price || 0) * Number(it.quantity || 0))}</strong>
                </div>

                <div className="cart-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeFromCart(it.productId)}>
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </article>

          <aside className="card cart-summary">
            <h3>Thanh toán</h3>
            <div className="summary-row">
              <span className="muted">Tạm tính</span>
              <strong>{pricing.subtotalText}</strong>
            </div>
            <div className="summary-row">
              <span className="muted">Giảm giá</span>
              <strong>{pricing.discountText}</strong>
            </div>
            <div className="summary-row total">
              <span>Tổng</span>
              <strong>{pricing.totalText}</strong>
            </div>

            <div className="voucher-box">
              <label className="muted small">Voucher</label>
              <div className="voucher-row">
                <input
                  placeholder="Nhập mã (ví dụ WELCOME10)"
                  value={cart.voucherCode || ''}
                  onChange={(e) => setVoucherCode(e.target.value)}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={applyVoucher}>
                  Áp dụng
                </button>
              </div>
              {cart.voucher ? (
                <div className="alert alert-success" style={{ marginTop: 10 }}>
                  Đã áp dụng <strong>{cart.voucher.code}</strong>
                </div>
              ) : cart.voucherCode ? (
                <div className="alert" style={{ marginTop: 10, border: '1px solid rgba(34,50,87,0.5)' }}>
                  Chưa áp dụng voucher. Bấm “Áp dụng” để kiểm tra.
                </div>
              ) : null}
            </div>

            <button type="button" className="btn btn-primary btn-full" onClick={() => navigate('/checkout')}>
              Thanh toán
            </button>
          </aside>
        </div>
      )}
    </section>
  )
}

