import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client.js'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../utils/format.js'

const emptyForm = { code: '', kind: 'PERCENT', value: '', minSubtotal: '', active: true }

function normalizeKind(k) {
  const v = String(k || '').trim().toUpperCase()
  return v === 'FIXED' ? 'FIXED' : 'PERCENT'
}

export default function AdminVouchers() {
  const { vouchers, loadVouchers } = useShop()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const view = useMemo(() => vouchers || [], [vouchers])

  const refresh = useCallback(async () => {
    await loadVouchers?.()
  }, [loadVouchers])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setOk('')
    const body = {
      code: String(form.code || '').trim().toUpperCase(),
      kind: normalizeKind(form.kind),
      value: form.value === '' ? null : Number(form.value),
      minSubtotal: form.minSubtotal === '' ? 0 : Number(form.minSubtotal),
      active: Boolean(form.active),
    }
    if (!body.code) {
      setError('Vui lòng nhập code voucher.')
      return
    }
    if (!Number.isFinite(body.value) || body.value <= 0) {
      setError('Giá trị voucher không hợp lệ.')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/vouchers', { method: 'POST', body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.text()) || 'Tạo/cập nhật voucher thất bại')
      setOk('Đã lưu voucher.')
      setForm(emptyForm)
      await refresh()
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Lỗi')
    } finally {
      setSaving(false)
    }
  }

  async function remove(code) {
    if (!window.confirm(`Xóa voucher ${code}?`)) return
    setError('')
    setOk('')
    try {
      const res = await apiFetch(`/api/admin/vouchers/${encodeURIComponent(code)}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error((await res.text()) || 'Xóa voucher thất bại')
      setOk('Đã xóa voucher.')
      await refresh()
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Lỗi')
    }
  }

  return (
    <section className="vouchers-page">
      <header className="page-header compact">
        <div>
          <h2>Quản lý voucher</h2>
          <p className="muted">Admin có thể thêm / xóa voucher động.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={refresh}>
            ↻ Làm mới
          </button>
        </div>
      </header>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {ok ? <div className="alert alert-success">{ok}</div> : null}

      <article className="card form-card" style={{ marginTop: 12 }}>
        <h3>Thêm / cập nhật voucher</h3>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Code *
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="VD: WELCOME10" />
          </label>
          <label>
            Loại *
            <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
              <option value="PERCENT">Percent (%)</option>
              <option value="FIXED">Fixed (VND)</option>
            </select>
          </label>
          <label>
            Giá trị *
            <input
              type="number"
              min="1"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder={form.kind === 'PERCENT' ? '10' : '50000'}
            />
          </label>
          <label>
            Đơn tối thiểu (VND)
            <input
              type="number"
              min="0"
              value={form.minSubtotal}
              onChange={(e) => setForm((f) => ({ ...f, minSubtotal: e.target.value }))}
              placeholder="0"
            />
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={Boolean(form.active)}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <span>Kích hoạt</span>
          </label>
          <div className="form-actions span-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
          </div>
        </form>
      </article>

      <div className="vouchers-grid" style={{ marginTop: 14 }}>
        {view.map((v) => (
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
            <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(v.code)}>
              🗑️ Xóa
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

