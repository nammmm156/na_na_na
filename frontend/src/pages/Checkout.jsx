import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { postOrder } from '../api/orders.js'
import { postPayosCreateLink } from '../api/payment.js'
import { apiFetch } from '../api/client.js'
import { SHOE_SIZES, parseAllowedShoeSize, stockQuantityForSize } from '../constants/shoeSizes.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../utils/format.js'
import { mapServerOrderToShop } from '../utils/orderMap.js'

async function parseJsonOrThrow(res) {
  const text = await res.text()
  if (!res.ok) {
    throw new Error(text || `Lỗi máy chủ (${res.status})`)
  }
  if (!text) return null
  return JSON.parse(text)
}

function normalizeItems(items) {
  return (items || [])
    .map((it) => ({
      productId: it.productId ?? it.id,
      name: it.name ?? 'Sản phẩm',
      price: Number(it.price || 0),
      imageUrl: it.imageUrl || '',
      quantity: Math.max(1, Number(it.quantity || 1)),
      shoeSize: parseAllowedShoeSize(it.shoeSize),
    }))
    .filter((it) => it.productId != null)
}

function calcDiscount(subtotal, voucher) {
  if (!voucher) return 0
  const minSubtotal = Number(voucher.minSubtotal || 0)
  if (subtotal < minSubtotal) return 0

  if (voucher.type === 'percent') {
    return Math.round((subtotal * Number(voucher.value || 0)) / 100)
  }
  if (voucher.type === 'fixed') {
    return Math.min(subtotal, Number(voucher.value || 0))
  }
  return 0
}

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { cart, vouchers, mergeServerOrder, clearCart, setVoucherCode, applyVoucher } = useShop()

  /** Luôn chuẩn hoá (trước đây giỏ hàng gửi thẳng cart.items → shoeSize lệ kiểu gây lỗi API). */
  const normalizedLines = useMemo(() => {
    const st = location.state
    if (st?.mode === 'buyNow' && Array.isArray(st.items)) {
      return normalizeItems(st.items)
    }
    return normalizeItems(cart.items)
  }, [location.state, cart.items])

  const isBuyNow = Boolean(location.state?.mode === 'buyNow' && Array.isArray(location.state?.items))

  const baseLines = useMemo(
    () =>
      normalizedLines.map((it) => ({
        ...it,
        shoeSize: parseAllowedShoeSize(it.shoeSize),
      })),
    [normalizedLines],
  )

  const [sizeByIndex, setSizeByIndex] = useState({})
  const [stocksByProductId, setStocksByProductId] = useState({})

  useEffect(() => {
    setSizeByIndex({})
  }, [normalizedLines])

  const productIdsForStock = useMemo(
    () => [...new Set(baseLines.map((l) => l.productId).filter((pid) => pid != null))],
    [baseLines],
  )

  useEffect(() => {
    if (!productIdsForStock.length) {
      setStocksByProductId({})
      return undefined
    }
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        productIdsForStock.map(async (pid) => {
          try {
            const res = await apiFetch(`/api/products/${pid}`)
            if (!res.ok) return [pid, null]
            const data = await res.json()
            return [pid, data.sizeQuantities && typeof data.sizeQuantities === 'object' ? data.sizeQuantities : {}]
          } catch {
            return [pid, null]
          }
        }),
      )
      if (!cancelled) {
        setStocksByProductId(Object.fromEntries(entries))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productIdsForStock])

  const lines = useMemo(
    () =>
      baseLines.map((it, idx) => ({
        ...it,
        shoeSize: Object.prototype.hasOwnProperty.call(sizeByIndex, idx) ? sizeByIndex[idx] : it.shoeSize,
      })),
    [baseLines, sizeByIndex],
  )

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.username || '',
    phone: '',
    addressLine: '',
    city: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [voucherFeedback, setVoucherFeedback] = useState({ type: '', message: '' })

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, it) => s + it.price * it.quantity, 0)
    const discount = calcDiscount(subtotal, cart.voucher)
    const total = Math.max(0, subtotal - discount)
    return { subtotal, discount, total }
  }, [lines, cart.voucher])

  function handleApplyVoucher() {
    const rawCode = String(cart.voucherCode || '').trim()
    if (!rawCode) {
      setVoucherFeedback({
        type: 'error',
        message: `Bạn chưa nhập mã voucher. Tổng giữ nguyên: ${formatPrice(totals.total)}.`,
      })
      return
    }

    const normalizedCode = rawCode.toUpperCase()
    const voucher = (vouchers || []).find((v) => String(v.code || '').toUpperCase() === normalizedCode) || null
    const nextDiscount = calcDiscount(totals.subtotal, voucher)
    const nextTotal = Math.max(0, totals.subtotal - nextDiscount)

    applyVoucher(normalizedCode)

    if (!voucher) {
      setVoucherFeedback({
        type: 'error',
        message: `Mã ${normalizedCode} không hợp lệ. Giảm giá: ${formatPrice(0)}. Tổng giữ nguyên: ${formatPrice(nextTotal)}.`,
      })
      return
    }

    if (nextDiscount <= 0) {
      const minSubtotal = Number(voucher.minSubtotal || 0)
      setVoucherFeedback({
        type: 'error',
        message: `Mã ${voucher.code} chưa đủ điều kiện áp dụng (đơn tối thiểu ${formatPrice(minSubtotal)}). Giảm giá: ${formatPrice(
          0,
        )}. Tổng giữ nguyên: ${formatPrice(nextTotal)}.`,
      })
      return
    }

    setVoucherFeedback({
      type: 'success',
      message: `Áp dụng ${voucher.code} thành công. Giảm: ${formatPrice(nextDiscount)}. Tổng sau áp mã: ${formatPrice(nextTotal)}.`,
    })
  }

  async function placeOrder(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!lines.length) {
      setError('Không có sản phẩm để thanh toán.')
      return
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine) {
      setError('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.')
      return
    }

    const unresolved = lines.findIndex((it) => parseAllowedShoeSize(it.shoeSize) == null)
    if (unresolved >= 0) {
      setError('Vui lòng chọn size giày (36–42) cho mỗi sản phẩm trước khi đặt hàng.')
      return
    }

    try {
      const payload = {
        items: lines.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          shoeSize: parseAllowedShoeSize(it.shoeSize),
        })),
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          addressLine: shippingAddress.addressLine,
          city: shippingAddress.city || '',
        },
        paymentMethod,
        note,
      }

      if (cart.voucher?.code) {
        payload.voucherCode = cart.voucher.code
      }

      const created = await parseJsonOrThrow(await postOrder(payload))

      if (paymentMethod === 'PAYOS_NAPAS247') {
        console.log('[Checkout] Creating PayOS payment link for order:', created.id)
        const linkRes = await postPayosCreateLink(created.id)
        console.log('[Checkout] PayOS link response status:', linkRes.status)
        if (!linkRes.ok) {
          const errorText = await linkRes.text()
          console.error('[Checkout] PayOS link creation failed:', errorText)
          throw new Error(`Không thể tạo link thanh toán: ${errorText}`)
        }
        const linkBody = await parseJsonOrThrow(linkRes)
        const url = linkBody?.checkoutUrl
        if (!url) {
          throw new Error('Máy chủ không trả về link thanh toán PayOS.')
        }
        if (!isBuyNow) clearCart()
        window.location.href = url
        return
      }

      mergeServerOrder(mapServerOrderToShop(created))
      if (!isBuyNow) clearCart()
      const oid = String(created.id)
      setSuccess(`Đặt hàng thành công. Mã đơn: ${oid}`)
      window.setTimeout(() => {
        navigate('/orders', { replace: true, state: { highlightOrderId: oid } })
      }, 900)
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi thanh toán.')
    }
  }

  return (
    <section className="checkout-page">
      <header className="page-header compact">
        <div>
          <h2>Thanh toán</h2>
          <p className="muted">Hoàn tất đơn hàng của bạn.</p>
        </div>
        <div className="header-actions">
          <Link to="/cart" className="btn btn-secondary btn-sm">
            Quay lại giỏ
          </Link>
        </div>
      </header>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      {lines.length === 0 ? (
        <div className="empty-state">
          <h3>Không có sản phẩm</h3>
          <p>Giỏ hàng trống. Hãy thêm sản phẩm trước khi thanh toán.</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/" className="btn btn-primary">
              Xem sản phẩm
            </Link>
          </div>
        </div>
      ) : (
        <div className="checkout-grid">
          <article className="card checkout-form">
            <h3>Thông tin giao hàng</h3>
            <form onSubmit={placeOrder} className="form-grid" style={{ marginTop: 12 }}>
              <label>
                Họ tên *
                <input
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress((s) => ({ ...s, fullName: e.target.value }))}
                  required
                />
              </label>
              <label>
                Số điện thoại *
                <input
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress((s) => ({ ...s, phone: e.target.value }))}
                  required
                />
              </label>
              <label className="span-2">
                Địa chỉ *
                <input
                  value={shippingAddress.addressLine}
                  onChange={(e) => setShippingAddress((s) => ({ ...s, addressLine: e.target.value }))}
                  required
                />
              </label>
              <label>
                Thành phố
                <input value={shippingAddress.city} onChange={(e) => setShippingAddress((s) => ({ ...s, city: e.target.value }))} />
              </label>
              <label>
                Thanh toán
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="COD">COD (nhận hàng trả tiền)</option>
                  <option value="CARD">Thẻ (mô phỏng)</option>
                  <option value="BANK">Chuyển khoản (mô phỏng)</option>
                  <option value="PAYOS_NAPAS247">Thanh toán Napas 247 (PayOS / VietQR)</option>
                </select>
              </label>
              <label className="span-2">
                Ghi chú
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: giao giờ hành chính..." />
              </label>

              <div className="form-actions span-2">
                <button type="submit" className="btn btn-primary">
                  Đặt hàng
                </button>
                <Link to="/" className="btn btn-secondary">
                  Tiếp tục mua
                </Link>
              </div>
            </form>
          </article>

          <aside className="card checkout-summary">
            <h3>Đơn hàng</h3>
            <div className="checkout-items">
              {lines.map((it, idx) => (
                <div key={`${it.productId}-${idx}`} className="checkout-row checkout-row-stack">
                  <div className="checkout-prod">
                    <img
                      className="cart-thumb"
                      src={
                        it.imageUrl ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={it.name}
                    />
                    <div className="checkout-prod-meta">
                      <div className="cart-name">{it.name}</div>
                      <label className="checkout-size-field muted small">
                        Size (EU)
                        <select
                          aria-required="true"
                          value={
                            it.shoeSize != null && SHOE_SIZES.includes(Number(it.shoeSize))
                              ? String(it.shoeSize)
                              : ''
                          }
                          onChange={(e) => {
                            const v = e.target.value
                            setSizeByIndex((prev) => ({
                              ...prev,
                              [idx]: v === '' ? null : Number(v),
                            }))
                          }}
                        >
                          <option value="">-- Chọn size --</option>
                          {SHOE_SIZES.map((s) => {
                            const q = stockQuantityForSize(stocksByProductId[it.productId], s)
                            const label = q == null ? String(s) : `${s} (còn ${q})`
                            return (
                              <option key={s} value={s}>
                                {label}
                              </option>
                            )
                          })}
                        </select>
                      </label>
                      <div className="muted small">
                        {formatPrice(it.price)} × {it.quantity}
                      </div>
                    </div>
                  </div>
                  <strong>{formatPrice(it.price * it.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="summary-row">
              <span className="muted">Tạm tính</span>
              <strong>{formatPrice(totals.subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span className="muted">Giảm giá</span>
              <strong>{formatPrice(totals.discount)}</strong>
            </div>
            <div className="summary-row total">
              <span>Tổng</span>
              <strong>{formatPrice(totals.total)}</strong>
            </div>

            <div className="voucher-box" style={{ marginTop: 10 }}>
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
            </div>

            {voucherFeedback.message ? (
              <div
                className={voucherFeedback.type === 'success' ? 'alert alert-success' : 'alert alert-error'}
                style={{ marginTop: 12, marginBottom: 0 }}
              >
                {voucherFeedback.message}
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  )
}

