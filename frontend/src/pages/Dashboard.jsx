import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client.js'

function toNumber(value) {
  if (value == null) return 0
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

function getRollingSixMonths() {
  const out = []
  const now = new Date()
  for (let back = 5; back >= 0; back -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1)
    out.push({
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: d.toLocaleString('en-US', { month: 'short' }),
      value: 0,
    })
  }
  return out
}

function buildMonthlyRevenueSeries(stats) {
  const slots = getRollingSixMonths()
  const fromApi = Array.isArray(stats?.monthlyRevenue) ? stats.monthlyRevenue : []
  if (fromApi.length === 0) {
    return slots
  }

  return slots.map((slot, i) => {
    const byLabel = fromApi.find((point) => (point.month || point.label) === slot.month)
    const point = byLabel ?? fromApi[i]
    const value = point ? toNumber(point.value ?? point.amount) : 0
    return { ...slot, value }
  })
}

function formatTrend(percent) {
  const p = toNumber(percent)
  if (p > 0) return `+${p.toFixed(1)}%`
  if (p < 0) return `${p.toFixed(1)}%`
  return '0%'
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
<<<<<<< HEAD
      const res = await apiFetch('/api/products/statistics')
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Không tải được dashboard')
=======
      const res = await apiFetch('/api/admin/dashboard-stats?days=30')
      if (res.ok) {
        setStats(await res.json())
>>>>>>> payos_feature
      }
      setStats(await res.json())
    } catch (e) {
      setStats(null)
      setError(e.message || 'Không tải được dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

<<<<<<< HEAD
  useEffect(() => {
    const onStatsUpdated = () => loadStats()
    window.addEventListener('shop:stats-updated', onStatsUpdated)
    return () => window.removeEventListener('shop:stats-updated', onStatsUpdated)
  }, [loadStats])

  const monthlyRevenue = useMemo(() => buildMonthlyRevenueSeries(stats), [stats])
  const maxMonthlyValue = useMemo(() => Math.max(1, ...monthlyRevenue.map((p) => p.value)), [monthlyRevenue])
=======
  const dailyRevenue = Array.isArray(stats?.dailyRevenue) ? stats.dailyRevenue : []
  const maxDailyRevenue = dailyRevenue.reduce((max, p) => Math.max(max, Number(p?.revenue || 0)), 0)
>>>>>>> payos_feature
  const salesByCategory = Array.isArray(stats?.salesByCategory) ? stats.salesByCategory : []

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

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="stats-grid">
<<<<<<< HEAD
        <StatCard
          label="Revenue"
          value={toCurrency(toNumber(stats?.totalRevenue))}
          trend={formatTrend(stats?.revenueGrowthPercent)}
        />
        <StatCard label="Products" value={toNumber(stats?.totalProducts)} trend="" />
        <StatCard label="Items in Stock" value={toNumber(stats?.totalItemsLeft)} trend="" />
        <StatCard
          label="Items Sold"
          value={toNumber(stats?.totalItemsSold)}
          trend={formatTrend(stats?.itemsSoldGrowthPercent)}
        />
=======
        <StatCard label="Revenue" value={toCurrency(stats?.totalRevenue || 0)} trend="" />
        <StatCard label="Products" value={stats?.totalProducts || 0} trend="" />
        <StatCard label="Items in Stock" value={stats?.itemsInStock || 0} trend="" />
        <StatCard label="Items Sold" value={stats?.itemsSold || 0} trend="" />
>>>>>>> payos_feature
      </div>

      <div className="charts-grid">
        <article className="card chart-card">
          <h3>Revenue Overview</h3>
          <div className="line-chart">
<<<<<<< HEAD
            {monthlyRevenue.map((point, idx) => (
              <div key={point.monthKey} className="line-item">
                <div
                  className="line-bar"
                  style={{ height: `${(point.value / maxMonthlyValue) * 180}px` }}
                  title={`${point.month}: ${toCurrency(point.value)}`}
=======
            {dailyRevenue.map((point, idx) => (
              <div key={point.date} className="line-item">
                <div
                  className="line-bar"
                  style={{
                    height: `${maxDailyRevenue > 0 ? (Number(point.revenue || 0) / maxDailyRevenue) * 180 : 0}px`,
                  }}
                  title={`${formatDateLabel(point.date)}: ${toCurrency(point.revenue || 0)}`}
>>>>>>> payos_feature
                />
                <span>{formatDateLabel(point.date)}</span>
                {idx < dailyRevenue.length - 1 ? <i className="line-dot" /> : null}
              </div>
            ))}
          </div>
        </article>

        <article className="card chart-card">
          <h3>Sales by Category</h3>
          <div className="bar-chart">
<<<<<<< HEAD
            {salesByCategory.length === 0 ? (
              <p className="muted">Chưa có dữ liệu bán hàng theo danh mục.</p>
            ) : (
              salesByCategory.map((item) => {
                const pct = Math.max(0, Math.min(100, toNumber(item.percent)))
                return (
                  <div key={item.category} className="bar-row">
                    <span>{item.category || 'Khác'}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <strong>{pct}%</strong>
                  </div>
                )
              })
            )}
=======
            {salesByCategory.map((item) => (
              <div key={item.category} className="bar-row">
                <span>{item.category}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Number(item.percent || 0)}%` }} />
                </div>
                <strong>{Number(item.percent || 0)}%</strong>
              </div>
            ))}
>>>>>>> payos_feature
          </div>
        </article>
      </div>
    </section>
  )
}

function StatCard({ label, value, trend }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
      {trend ? <span>{trend}</span> : null}
    </article>
  )
}

function toCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    value,
  )
}

function formatDateLabel(isoDate) {
  if (!isoDate) return ''
  // isoDate expected: yyyy-MM-dd
  const [y, m, d] = String(isoDate).split('-')
  if (!y || !m || !d) return String(isoDate)
  return `${d}/${m}`
}
