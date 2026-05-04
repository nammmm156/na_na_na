import { apiFetch } from './client.js'

export async function postOrder(body) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchOrder(orderId) {
  return apiFetch(`/api/orders/${orderId}`)
}

export async function fetchOrderStatus(orderId) {
  return apiFetch(`/api/orders/${orderId}/status`)
}
