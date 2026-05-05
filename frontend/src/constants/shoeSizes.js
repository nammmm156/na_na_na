/** Size EU cố định cho giày trong shop */
export const SHOE_SIZES = [39, 40, 41, 42]

/** Chỉ chấp nhận đúng 39–42; mọi giá trị khác → null (không gửi lệnh sai lên server). */
export function parseAllowedShoeSize(v) {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).trim())
  if (!Number.isFinite(n)) return null
  const r = Math.round(n)
  return SHOE_SIZES.includes(r) ? r : null
}
