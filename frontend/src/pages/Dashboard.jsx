import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api/client.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/dashboard-stats?days=30')
      if (res.ok) {
        setStats(await res.json())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const dailyRevenue = Array.isArray(stats?.dailyRevenue) ? stats.dailyRevenue : []
  const maxDailyRevenue = dailyRevenue.reduce((max, p) => Math.max(max, Number(p?.revenue || 0)), 0)
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

      <div className="stats-grid">
        <StatCard label="Revenue" value={toCurrency(stats?.totalRevenue || 0)} trend="" />
        <StatCard label="Products" value={stats?.totalProducts || 0} trend="" />
        <StatCard label="Items in Stock" value={stats?.itemsInStock || 0} trend="" />
        <StatCard label="Items Sold" value={stats?.itemsSold || 0} trend="" />
      </div>

      <div className="charts-grid">
        <article className="card chart-card">
          <h3>Revenue Overview</h3>
          <div className="line-chart">
            {dailyRevenue.map((point, idx) => (
              <div key={point.date} className="line-item">
                <div
                  className="line-bar"
                  style={{
                    height: `${maxDailyRevenue > 0 ? (Number(point.revenue || 0) / maxDailyRevenue) * 180 : 0}px`,
                  }}
                  title={`${formatDateLabel(point.date)}: ${toCurrency(point.revenue || 0)}`}
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
            {salesByCategory.map((item) => (
              <div key={item.category} className="bar-row">
                <span>{item.category}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Number(item.percent || 0)}%` }} />
                </div>
                <strong>{Number(item.percent || 0)}%</strong>
              </div>
            ))}
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
