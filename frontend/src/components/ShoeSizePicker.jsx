import { SHOE_SIZES } from '../constants/shoeSizes.js'

export default function ShoeSizePicker({ value, onChange, labelledById, className, sizeQuantities }) {
  const selectValue =
    value != null && SHOE_SIZES.includes(Number(value)) ? String(Number(value)) : ''

  const qtyBySize = sizeQuantities && typeof sizeQuantities === 'object' ? sizeQuantities : {}

  return (
    <div className={['shoe-size-picker', className].filter(Boolean).join(' ')}>
      <label className="shoe-size-field" htmlFor={labelledById}>
        <span className="shoe-size-label">Chọn size (EU)</span>
        <select
          id={labelledById}
          className="shoe-size-select"
          aria-required="true"
          value={selectValue}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') onChange(null)
            else onChange(Number(raw))
          }}
        >
          <option value="">-- Chọn size --</option>
          {SHOE_SIZES.map((s) => (
            <option key={s} value={s} disabled={Number(qtyBySize?.[s] ?? 0) <= 0}>
              {s} {qtyBySize?.[s] != null ? `(còn ${Number(qtyBySize[s] || 0)})` : ''}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
