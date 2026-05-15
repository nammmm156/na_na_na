import { apiFetch } from './client.js'

export async function fetchProductReviews(productId) {
  const res = await apiFetch(`/api/reviews/${productId}`)
  if (!res.ok) throw new Error('Không tải được đánh giá')
  return res.json()
}

/**
 * @param {string|number} productId
 * @returns {Promise<{ eligible: boolean, message?: string | null }>}
 */
export async function fetchReviewEligibility(productId) {
  const res = await apiFetch(`/api/reviews/eligibility/${productId}`)
  if (res.status === 401) {
    return { eligible: false, message: 'Vui lòng đăng nhập để kiểm tra quyền đánh giá.' }
  }
  if (res.status === 404) {
    return { eligible: false, message: 'Không tìm thấy sản phẩm.' }
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Không kiểm tra được quyền đánh giá')
  }
  return res.json()
}

/**
 * @param {{ productId: number, rating: number, comment: string }} payload
 */
export async function postReview(payload) {
  const res = await apiFetch('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Gửi đánh giá thất bại')
  }
  return res.json()
}
