const MIN_EU = 36
const MAX_EU = 42

/** Size EU cố định cho giày trong shop */
export const SHOE_SIZES = Array.from({ length: MAX_EU - MIN_EU + 1 }, (_, i) => MIN_EU + i)

/** Chỉ chấp nhận đúng 36–42; mọi giá trị khác → null (không gửi lệnh sai lên server). */
export function parseAllowedShoeSize(v) {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).trim())
  if (!Number.isFinite(n)) return null
  const r = Math.round(n)
  return SHOE_SIZES.includes(r) ? r : null
}

/** Stock for one EU size from API map (keys may be number or string). Returns null if unknown. */
export function stockQuantityForSize(sizeQuantities, size) {
  if (!sizeQuantities || typeof sizeQuantities !== 'object') return null
  const raw = sizeQuantities[size] ?? sizeQuantities[String(size)]
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}
