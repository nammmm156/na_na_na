import { apiFetch } from './client.js'

export async function fetchProductReviews(productId) {
  const res = await apiFetch(`/api/reviews/${productId}`)
  if (!res.ok) throw new Error('Không tải được đánh giá')
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
