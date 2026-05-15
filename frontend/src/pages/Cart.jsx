import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, pricing, vouchers, setQuantity, removeFromCart, setVoucherCode, applyVoucher } = useShop()
  const [voucherFeedback, setVoucherFeedback] = useState({ type: '', message: '' })

  const items = cart.items || []
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0),
    [items],
  )

  function calcDiscountForVoucher(voucher) {
    if (!voucher) return 0
    if (subtotal < Number(voucher.minSubtotal || 0)) return 0
    if (voucher.type === 'percent') return Math.round((subtotal * Number(voucher.value || 0)) / 100)
    if (voucher.type === 'fixed') return Math.min(subtotal, Number(voucher.value || 0))
    return 0
  }

  function handleApplyVoucher() {
    const code = String(cart.voucherCode || '').trim().toUpperCase()
    if (!code) {
      setVoucherFeedback({
        type: 'error',
        message: `Bạn chưa nhập mã voucher. Tổng giữ nguyên: ${formatPrice(pricing.total)}.`,
      })
      return
    }

    const voucher = (vouchers || []).find((v) => String(v.code || '').toUpperCase() === code) || null
    const discount = calcDiscountForVoucher(voucher)
    const nextTotal = Math.max(0, subtotal - discount)
    applyVoucher(code)

    if (!voucher) {
      setVoucherFeedback({
        type: 'error',
        message: `Mã ${code} không hợp lệ. Giảm giá: ${formatPrice(0)}. Tổng giữ nguyên: ${formatPrice(nextTotal)}.`,
      })
      return
    }

    if (discount <= 0) {
      setVoucherFeedback({
        type: 'error',
        message: `Mã ${voucher.code} chưa đủ điều kiện (đơn tối thiểu ${formatPrice(
          voucher.minSubtotal || 0,
        )}). Giảm giá: ${formatPrice(0)}. Tổng giữ nguyên: ${formatPrice(nextTotal)}.`,
      })
      return
    }

    setVoucherFeedback({
      type: 'success',
      message: `Áp dụng ${voucher.code} thành công. Giảm: ${formatPrice(discount)}. Tổng sau giảm: ${formatPrice(nextTotal)}.`,
    })
  }

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

            {items.map((it, idx) => (
              <div key={`${it.productId}-${it.shoeSize ?? 'x'}-${idx}`} className="cart-row">
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
                    <div className="muted small">
                      {it.shoeSize != null ? <>Size {it.shoeSize} · </> : null}
                      {formatPrice(it.price)}
                    </div>
                  </div>
                </div>

                <div className="cart-qty">
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => setQuantity(it.productId, e.target.value, it.shoeSize)}
                  />
                </div>

                <div className="cart-line-total">
                  <strong>{formatPrice(Number(it.price || 0) * Number(it.quantity || 0))}</strong>
                </div>

                <div className="cart-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeFromCart(it.productId, it.shoeSize)}>
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
                  onChange={(e) => {
                    setVoucherCode(e.target.value)
                    setVoucherFeedback({ type: '', message: '' })
                  }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleApplyVoucher}>
                  Áp dụng
                </button>
              </div>
              {voucherFeedback.message ? (
                <div
                  className={voucherFeedback.type === 'success' ? 'alert alert-success' : 'alert alert-error'}
                  style={{ marginTop: 10, marginBottom: 0 }}
                >
                  {voucherFeedback.message}
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

