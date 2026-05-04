import { apiFetch } from './client.js'

export async function postPayosCreateLink(orderId) {
  return apiFetch(`/api/payment/create-link/${orderId}`, { method: 'POST' })
}
