/**
 * Map backend OrderResponseDto JSON to the shape stored in ShopContext `orders`.
 */
export function mapServerOrderToShop(o) {
  if (!o) return null
  return {
    id: String(o.id),
    createdAt: new Date().toISOString(),
    status: o.status,
    paymentMethod: o.paymentMethod,
    items: (o.lineItems || []).map((l) => ({
      productId: l.productId,
      name: l.productName || 'Sản phẩm',
      price: Number(l.unitPrice || 0),
      imageUrl: '',
      quantity: l.quantity ?? 1,
      shoeSize: l.shoeSize != null ? Number(l.shoeSize) : null,
    })),
    pricing: {
      subtotal: Number(o.subtotalAmount || 0),
      discount: Number(o.discountAmount || 0),
      total: Number(o.totalAmount || 0),
      voucher: o.voucherCode ? { code: o.voucherCode } : null,
    },
    shippingAddress: {
      fullName: o.shipFullName || '',
      phone: o.shipPhone || '',
      addressLine: o.shipAddressLine || '',
      city: o.shipCity || '',
    },
    note: o.note || '',
  }
}
