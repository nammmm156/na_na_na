import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function orderLineKey(it) {
  return `${it.productId}|${it.shoeSize ?? ''}`
}

export default function Returns() {
  const { orders, returns, createReturnRequest } = useShop()
  const location = useLocation()

  const initialOrderId = location.state?.orderId || ''
  const [orderId, setOrderId] = useState(initialOrderId)
  const [lineKey, setLineKey] = useState('')
  const [reason, setReason] = useState('Không phù hợp')
  const [message, setMessage] = useState('')

  const selectedOrder = useMemo(() => orders.find((o) => o.id === orderId) || null, [orders, orderId])
  const orderItems = selectedOrder?.items || []

  const selectedItem = useMemo(
    () => orderItems.find((i) => orderLineKey(i) === lineKey) || null,
    [orderItems, lineKey],
  )

  useEffect(() => {
    setLineKey('')
  }, [orderId])

  function submit(e) {
    e.preventDefault()
    setMessage('')
    if (!orderId) {
      setMessage('Vui lòng chọn đơn hàng.')
      return
    }
    if (!selectedItem) {
      setMessage('Vui lòng chọn sản phẩm cần trả.')
      return
    }

    const ret = createReturnRequest({
      orderId,
      item: selectedItem,
      reason,
    })

    setMessage(`Đã tạo yêu cầu trả hàng: ${ret.id}`)
    setLineKey('')
  }

  return (
    <section className="returns-page">
      <header className="page-header compact">
        <div>
          <h2>Trả hàng</h2>
          <p className="muted">Tạo yêu cầu trả hàng cho các đơn đã mua (frontend-only).</p>
        </div>
        <div className="header-actions">
          <Link to="/orders" className="btn btn-secondary btn-sm">
            Lịch sử mua
          </Link>
        </div>
      </header>

      {message ? (
        <div className="alert" style={{ border: '1px solid rgba(34,50,87,0.5)' }}>
          {message}
        </div>
      ) : null}

      <div className="returns-grid">
        <article className="card return-form">
          <h3>Tạo yêu cầu</h3>
          <form onSubmit={submit} className="form-grid" style={{ marginTop: 12 }}>
            <label className="span-2">
              Chọn đơn hàng *
              <select value={orderId} onChange={(e) => setOrderId(e.target.value)} required>
                <option value="">-- Chọn --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} ({formatDate(o.createdAt)})
                  </option>
                ))}
              </select>
            </label>

            <label className="span-2">
              Chọn sản phẩm *
              <select value={lineKey} onChange={(e) => setLineKey(e.target.value)} required disabled={!orderId}>
                <option value="">-- Chọn --</option>
                {orderItems.map((it) => (
                  <option key={orderLineKey(it)} value={orderLineKey(it)}>
                    {it.name}
                    {it.shoeSize != null ? ` · Size ${it.shoeSize}` : ''} × {it.quantity}
                  </option>
                ))}
              </select>
            </label>

            <label className="span-2">
              Lý do
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="Không phù hợp">Không phù hợp</option>
                <option value="Sản phẩm lỗi">Sản phẩm lỗi</option>
                <option value="Giao sai sản phẩm">Giao sai sản phẩm</option>
                <option value="Đổi ý">Đổi ý</option>
              </select>
            </label>

            {selectedItem ? (
              <div className="span-2 alert" style={{ border: '1px solid rgba(34,50,87,0.5)' }}>
                Sản phẩm: <strong>{selectedItem.name}</strong>
                {selectedItem.shoeSize != null ? (
                  <>
                    {' '}
                    · Size <strong>{selectedItem.shoeSize}</strong>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="form-actions span-2">
              <button type="submit" className="btn btn-primary">
                Gửi yêu cầu
              </button>
              <Link to="/orders" className="btn btn-secondary">
                Xem đơn hàng
              </Link>
            </div>
          </form>
        </article>

        <article className="card return-list">
          <h3>Yêu cầu đã tạo</h3>
          {returns.length === 0 ? (
            <p className="muted">Chưa có yêu cầu trả hàng.</p>
          ) : (
            <div className="returns-stack">
              {returns.map((r) => (
                <div key={r.id} className="return-row">
                  <div>
                    <strong>{r.id}</strong>
                    <div className="muted small">
                      Đơn: {r.orderId} · {formatDate(r.createdAt)}
                    </div>
                    <div className="muted small">
                      {r.item?.name} · Lý do: {r.reason}
                    </div>
                  </div>
                  <strong>{r.status}</strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

