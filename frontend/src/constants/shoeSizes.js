/** Size EU cố định cho giày trong shop */
export const SHOE_SIZES = Array.from({ length: 45 - 35 + 1 }, (_, i) => 35 + i)

/** Chỉ chấp nhận đúng 35–45; mọi giá trị khác → null (không gửi lệnh sai lên server). */
export function parseAllowedShoeSize(v) {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).trim())
  if (!Number.isFinite(n)) return null
  const r = Math.round(n)
  return SHOE_SIZES.includes(r) ? r : null
}
