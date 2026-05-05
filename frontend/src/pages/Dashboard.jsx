import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client.js'

/** Số cột hiển thị trong khung (giống trước: 7 ngày) — toàn bộ tháng lấy từ API, kéo mũi tên để xem tiếp */
const REVENUE_VISIBLE_DAYS = 7

/** Ngày hiện tại theo Asia/Ho_Chi_Minh (khớp backend) dạng YYYY-MM-DD */
function todayIsoHoChiMinh() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  if (!y || !m || !d) return null
  return `${y}-${m}-${d}`
}

/** Dữ liệu từ GET /api/admin/dashboard-stats */
const emptyStats = {
  totalRevenue: 0,
  totalProducts: 0,
  itemsInStock: 0,
  itemsSold: 0,
  dailyRevenue: [],
  salesByCategory: [],
}

export default function Dashboard() {
  const [stats, setStats] = useState(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revenueStart, setRevenueStart] = useState(0)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/dashboard-stats')
      if (res.ok) {
        const data = await res.json()
        setStats({ ...emptyStats, ...data })
      } else {
        setStats(emptyStats)
        setError(res.status === 403 ? 'Bạn không có quyền xem dashboard.' : 'Không tải được dữ liệu dashboard.')
      }
    } catch {
      setStats(emptyStats)
      setError('Lỗi mạng hoặc máy chủ.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const daily = Array.isArray(stats.dailyRevenue) ? stats.dailyRevenue : []

  useEffect(() => {
    if (!daily.length) {
      setRevenueStart(0)
      return
    }
    const todayIso = todayIsoHoChiMinh()
    let endRef = daily.length - 1
    if (todayIso) {
      const idx = daily.findIndex((p) => p.date === todayIso)
      if (idx >= 0) endRef = idx
    }
    const span = Math.min(REVENUE_VISIBLE_DAYS, daily.length)
    const maxStart = Math.max(0, daily.length - span)
    const desired = Math.max(0, endRef - (span - 1))
    setRevenueStart(Math.min(desired, maxStart))
  }, [daily])

  const revenueSlice = useMemo(() => {
    if (!daily.length) return []
    const span = Math.min(REVENUE_VISIBLE_DAYS, daily.length)
    return daily.slice(revenueStart, revenueStart + span)
  }, [daily, revenueStart])

  const maxDaily = Math.max(1, ...revenueSlice.map((p) => Number(p.revenueVnd) || 0))

  const span = Math.min(REVENUE_VISIBLE_DAYS, daily.length || REVENUE_VISIBLE_DAYS)
  const canScrollRevenue = daily.length > REVENUE_VISIBLE_DAYS
  const canPrevRevenue = canScrollRevenue && revenueStart > 0
  const canNextRevenue = canScrollRevenue && revenueStart < daily.length - span

  const categories = Array.isArray(stats.salesByCategory) ? stats.salesByCategory : []

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="page-title">
          <h1>Dashboard</h1>
        </div>
        <p className="muted">Đang tải...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-page">
      <div className="page-title">
        <h1>Dashboard</h1>
      </div>

      {error ? <p className="muted">{error}</p> : null}

      <div className="stats-grid">
        <StatCard label="Revenue" value={toCurrency(Number(stats.totalRevenue) || 0)} />
        <StatCard label="Products" value={stats.totalProducts ?? 0} />
        <StatCard label="Items in Stock" value={stats.itemsInStock ?? 0} />
        <StatCard label="Items Sold" value={stats.itemsSold ?? 0} />
      </div>

      <div className="charts-grid">
        <article className="card chart-card">
          <h3>Revenue Overview</h3>
          <p className="muted" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            Doanh thu theo ngày trong tháng hiện tại (đơn đã thanh toán). Dùng mũi tên để xem các ngày khác.
          </p>
          <div className="revenue-chart-row">
            <button
              type="button"
              className="chart-nav chart-nav--prev"
              disabled={!canPrevRevenue}
              onClick={() => setRevenueStart((s) => Math.max(0, s - 1))}
              aria-label="Xem các ngày trước"
            >
              <span className="chart-nav-triangle chart-nav-triangle--left" aria-hidden />
            </button>
            <div className="line-chart">
              {daily.length === 0 ? (
                <p className="muted">Chưa có dữ liệu doanh thu theo ngày.</p>
              ) : (
                revenueSlice.map((point, idx) => {
                  const vnd = Number(point.revenueVnd) || 0
                  const label = point.label || point.date || ''
                  return (
                    <div key={point.date || idx} className="line-item">
                      <div
                        className="line-bar"
                        style={{ height: `${(vnd / maxDaily) * 180}px` }}
                        title={`${label}: ${toCurrency(vnd)}`}
                      />
                      <span>{label}</span>
                      {idx < revenueSlice.length - 1 ? <i className="line-dot" /> : null}
                    </div>
                  )
                })
              )}
            </div>
            <button
              type="button"
              className="chart-nav chart-nav--next"
              disabled={!canNextRevenue}
              onClick={() => setRevenueStart((s) => Math.min(daily.length - span, s + 1))}
              aria-label="Xem các ngày sau"
            >
              <span className="chart-nav-triangle chart-nav-triangle--right" aria-hidden />
            </button>
          </div>
        </article>

        <article className="card chart-card">
          <h3>Sales by Category</h3>
          <div className="bar-chart">
            {categories.length === 0 ? (
              <p className="muted">Chưa có đơn hàng đã thanh toán theo danh mục.</p>
            ) : (
              categories.map((item) => {
                const pct = typeof item.percent === 'number' ? item.percent : 0
                const name = item.category || 'Khác'
                return (
                  <div key={name} className="bar-row">
                    <span>{name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <strong>{pct}%</strong>
                  </div>
                )
              })
            )}
          </div>
        </article>
      </div>
    </section>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  )
}

function toCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    value,
  )
}
