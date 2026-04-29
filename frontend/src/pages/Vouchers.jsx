import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function Vouchers() {
  const navigate = useNavigate()
  const { vouchers, cart, setVoucherCode, applyVoucher, pricing } = useShop()

  return (
    <section className="vouchers-page">
      <header className="page-header compact">
        <div>
          <h2>Voucher</h2>
          <p className="muted">Chọn mã giảm giá và áp dụng vào giỏ hàng.</p>
        </div>
        <div className="header-actions">
          <Link to="/cart" className="btn btn-secondary btn-sm">
            Giỏ hàng
          </Link>
        </div>
      </header>

      <article className="card voucher-apply">
        <div className="voucher-row" style={{ marginTop: 6 }}>
          <input
            placeholder="Nhập mã voucher"
            value={cart.voucherCode || ''}
            onChange={(e) => setVoucherCode(e.target.value)}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={applyVoucher}>
            Áp dụng
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/cart')}>
            Xem giỏ
          </button>
        </div>
        <div className="muted small" style={{ marginTop: 10 }}>
          Tạm tính: <strong>{pricing.subtotalText}</strong> · Giảm: <strong>{pricing.discountText}</strong> · Tổng:{' '}
          <strong>{pricing.totalText}</strong>
        </div>

        {cart.voucher ? (
          <div className="alert alert-success" style={{ marginTop: 10 }}>
            Đã áp dụng <strong>{cart.voucher.code}</strong>
          </div>
        ) : null}
      </article>

      <div className="vouchers-grid" style={{ marginTop: 14 }}>
        {vouchers.map((v) => (
          <article key={v.code} className="card voucher-card">
            <div className="voucher-head">
              <strong>{v.code}</strong>
              <span className="muted small">
                {v.type === 'percent' ? `-${v.value}%` : `-${formatPrice(v.value)}`}
              </span>
            </div>
            <p className="muted small" style={{ marginTop: 6 }}>
              Đơn tối thiểu: <strong>{formatPrice(v.minSubtotal || 0)}</strong>
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setVoucherCode(v.code)
                applyVoucher()
              }}
            >
              Dùng mã này
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

