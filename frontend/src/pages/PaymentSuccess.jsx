import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchOrder, fetchOrderStatus } from '../api/orders.js'
import { useShop } from '../context/ShopContext.jsx'
import { mapServerOrderToShop } from '../utils/orderMap.js'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { mergeServerOrder } = useShop()

  const [phase, setPhase] = useState('waiting') // waiting | paid | timeout

  useEffect(() => {
    if (!orderId) {
      return
    }

    let attempts = 0
    let merged = false

    const timer = window.setInterval(async () => {
      attempts += 1
      try {
        const statusRes = await fetchOrderStatus(orderId)
        if (!statusRes.ok) return

        const s = await statusRes.json()

        if (s.status === 'PAID') {
          window.clearInterval(timer)
          if (!merged) {
            merged = true
            try {
              const fullRes = await fetchOrder(orderId)
              if (fullRes.ok) {
                const o = await fullRes.json()
                mergeServerOrder(mapServerOrderToShop(o))
              }
            } catch {
              /* local history optional */
            }
          }
          setPhase('paid')
        } else if (attempts >= 45) {
          window.clearInterval(timer)
          setPhase('timeout')
        }
      } catch {
        if (attempts >= 45) {
          window.clearInterval(timer)
          setPhase('timeout')
        }
      }
    }, 2000)

    return () => {
      window.clearInterval(timer)
    }
  }, [orderId, mergeServerOrder])

  if (!orderId) {
    return (
      <section className="checkout-page">
        <div className="alert alert-error">Thiếu mã đơn hàng trên URL thanh toán.</div>
        <Link to="/cart" className="btn btn-secondary">
          Về giỏ hàng
        </Link>
      </section>
    )
  }

  return (
    <section className="checkout-page">
      <header className="page-header compact">
        <div>
          <h2>Kết quả thanh toán</h2>
          <p className="muted">Đơn hàng #{orderId}</p>
        </div>
      </header>

      {phase === 'waiting' ? (
        <div className="alert alert-success">
          Cảm ơn bạn. Hệ thống đang xác nhận giao dịch từ PayOS/Ngân hàng (polling mỗi vài giây)...
        </div>
      ) : null}

      {phase === 'paid' ? (
        <div className="alert alert-success">
          <strong>Thanh toán thành công.</strong> Đơn #{orderId} đã được ghi nhận.
        </div>
      ) : null}

      {phase === 'timeout' ? (
        <div className="alert alert-error">
          Chưa nhận được xác nhận thanh toán tự động. Nếu bạn đã chuyển tiền, vui lòng kiểm tra mục &quot;Đơn hàng&quot;
          sau ít phút hoặc liên hệ hỗ trợ.
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/orders" className="btn btn-primary">
          Xem đơn hàng
        </Link>
        <Link to="/" className="btn btn-secondary">
          Tiếp tục mua
        </Link>
      </div>
    </section>
  )
}
