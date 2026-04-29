import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api/client.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/products/statistics')
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

  const salesByCategory = [
    { category: 'Headphones', value: 35 },
    { category: 'Laptop', value: 28 },
    { category: 'Camera', value: 20 },
    { category: 'Smartwatch', value: 10 },
    { category: 'Backpack', value: 7 },
  ]

  const monthlyRevenue = [
    { month: 'Jan', value: 120 },
    { month: 'Feb', value: 150 },
    { month: 'Mar', value: 168 },
    { month: 'Apr', value: 194 },
    { month: 'May', value: 226 },
    { month: 'Jun', value: 248 },
  ]

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
        <StatCard label="Revenue" value={toCurrency(stats?.totalRevenue || 0)} trend="+12.5%" />
        <StatCard label="Products" value={stats?.totalProducts || 0} trend="+3.1%" />
        <StatCard label="Items in Stock" value={stats?.totalItemsLeft || 0} trend="" />
        <StatCard label="Items Sold" value={stats?.totalItemsSold || 0} trend="+8.2%" />
      </div>

      <div className="charts-grid">
        <article className="card chart-card">
          <h3>Revenue Overview</h3>
          <div className="line-chart">
            {monthlyRevenue.map((point, idx) => (
              <div key={point.month} className="line-item">
                <div
                  className="line-bar"
                  style={{ height: `${(point.value / 260) * 180}px` }}
                  title={`${point.month}: $${point.value}k`}
                />
                <span>{point.month}</span>
                {idx < monthlyRevenue.length - 1 ? <i className="line-dot" /> : null}
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
                  <div className="bar-fill" style={{ width: `${item.value}%` }} />
                </div>
                <strong>{item.value}%</strong>
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
