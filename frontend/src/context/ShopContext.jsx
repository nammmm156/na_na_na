import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { parseAllowedShoeSize } from '../constants/shoeSizes.js'
import { formatPrice } from '../utils/format.js'

const ShopContext = createContext(null)

const STORAGE_PREFIX = 'quanlyshop_shop_v1'

function storageKey(username) {
  const u = username || 'guest'
  return `${STORAGE_PREFIX}:${u}`
}

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function readState(username) {
  const initial = {
    cart: {
      items: [],
      voucherCode: '',
      voucher: null,
    },
    orders: [],
    returns: [],
  }
  return safeJsonParse(localStorage.getItem(storageKey(username)), initial)
}

function writeState(username, state) {
  localStorage.setItem(storageKey(username), JSON.stringify(state))
}

function uid() {
  // Reasonable unique id for client-only records
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

const VOUCHERS = [
  { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 100000 },
  { code: 'FREESHIP', type: 'fixed', value: 30000, minSubtotal: 200000 },
  { code: 'VIP50K', type: 'fixed', value: 50000, minSubtotal: 500000 },
]

function normalizeProduct(product) {
  if (!product) return null
  return {
    id: product.id,
    name: product.name ?? 'Sản phẩm',
    price: product.price ?? 0,
    imageUrl: product.imageUrl ?? '',
    category: product.category ?? '',
    stockQuantity: product.stockQuantity ?? null,
  }
}

function normalizeShoeSize(v) {
  return parseAllowedShoeSize(v)
}

function cartLineMatches(item, productId, shoeSize) {
  if (Number(item.productId) !== Number(productId)) return false
  return normalizeShoeSize(item.shoeSize) === normalizeShoeSize(shoeSize)
}

function findVoucher(code) {
  if (!code) return null
  const normalized = String(code).trim().toUpperCase()
  return VOUCHERS.find((v) => v.code === normalized) || null
}

function calcSubtotal(items) {
  return items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0)
}

function calcDiscount(subtotal, voucher) {
  if (!voucher) return 0
  if (subtotal < (voucher.minSubtotal || 0)) return 0
  if (voucher.type === 'percent') return Math.round((subtotal * voucher.value) / 100)
  if (voucher.type === 'fixed') return Math.min(subtotal, voucher.value)
  return 0
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.state

    case 'cart/add': {
      const p = normalizeProduct(action.product)
      if (!p) return state
      const qty = Math.max(1, Number(action.quantity || 1))
      const shoeSize = normalizeShoeSize(action.shoeSize)
      if (shoeSize == null) return state
      const items = [...state.cart.items]
      const idx = items.findIndex((i) => cartLineMatches(i, p.id, shoeSize))
      if (idx >= 0) {
        const nextQty = items[idx].quantity + qty
        items[idx] = { ...items[idx], quantity: nextQty }
      } else {
        items.push({
          productId: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          quantity: qty,
          shoeSize,
        })
      }
      return { ...state, cart: { ...state.cart, items } }
    }

    case 'cart/remove': {
      const items = state.cart.items.filter((i) => !cartLineMatches(i, action.productId, action.shoeSize))
      return { ...state, cart: { ...state.cart, items } }
    }

    case 'cart/setQty': {
      const qty = Number(action.quantity || 0)
      const items = state.cart.items
        .map((i) => (cartLineMatches(i, action.productId, action.shoeSize) ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0)
      return { ...state, cart: { ...state.cart, items } }
    }

    case 'cart/clear':
      return { ...state, cart: { ...state.cart, items: [], voucherCode: '', voucher: null } }

    case 'cart/setVoucherCode':
      return { ...state, cart: { ...state.cart, voucherCode: action.code } }

    case 'cart/applyVoucher': {
      const voucher = findVoucher(state.cart.voucherCode)
      return { ...state, cart: { ...state.cart, voucher } }
    }

    case 'order/create': {
      const order = action.order
      return { ...state, orders: [order, ...state.orders] }
    }

    /** Replace or prepend an order synced from the API (same id overrides local copy). */
    case 'order/mergeServer': {
      const order = action.order
      if (!order || order.id == null) return state
      const oid = String(order.id)
      const rest = state.orders.filter((o) => String(o.id) !== oid)
      return { ...state, orders: [order, ...rest] }
    }

    case 'return/create': {
      const ret = action.returnRequest
      return { ...state, returns: [ret, ...state.returns] }
    }

    default:
      return state
  }
}

export function ShopProvider({ username, children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => readState(username))

  useEffect(() => {
    // Persist after every change
    writeState(username, state)
  }, [username, state])

  useEffect(() => {
    // When user changes (login/logout), hydrate correct store
    dispatch({ type: 'hydrate', state: readState(username) })
  }, [username])

  const act = useCallback((action) => dispatch(action), [])

  const cartItemsCount = state.cart.items.reduce((n, i) => n + (i.quantity || 0), 0)
  const subtotal = calcSubtotal(state.cart.items)
  const discount = calcDiscount(subtotal, state.cart.voucher)
  const total = Math.max(0, subtotal - discount)

  const addToCart = useCallback(
    (product, quantity = 1, options = {}) =>
      act({ type: 'cart/add', product, quantity, shoeSize: options.shoeSize }),
    [act],
  )
  const removeFromCart = useCallback(
    (productId, shoeSize) => act({ type: 'cart/remove', productId, shoeSize }),
    [act],
  )
  const setQuantity = useCallback(
    (productId, quantity, shoeSize) => act({ type: 'cart/setQty', productId, quantity, shoeSize }),
    [act],
  )
  const clearCart = useCallback(() => act({ type: 'cart/clear' }), [act])

  const setVoucherCode = useCallback((code) => act({ type: 'cart/setVoucherCode', code }), [act])
  const applyVoucher = useCallback(() => act({ type: 'cart/applyVoucher' }), [act])

  const mergeServerOrder = useCallback((order) => act({ type: 'order/mergeServer', order }), [act])

  /** Local-only simulated order used by demos; server checkout uses mergeServerOrder. */
  const createOrder = useCallback(
    ({ items, shippingAddress, paymentMethod, note }) => {
      const orderSubtotal = calcSubtotal(items)
      const voucher = state.cart.voucher
      const orderDiscount = calcDiscount(orderSubtotal, voucher)
      const orderTotal = Math.max(0, orderSubtotal - orderDiscount)
      const order = {
        id: uid(),
        createdAt: new Date().toISOString(),
        status: 'PAID',
        items,
        pricing: {
          subtotal: orderSubtotal,
          discount: orderDiscount,
          total: orderTotal,
          voucher: voucher ? { code: voucher.code, type: voucher.type, value: voucher.value } : null,
        },
        shippingAddress,
        paymentMethod,
        note: note || '',
      }
      act({ type: 'order/create', order })
      return order
    },
    [act, state.cart.voucher],
  )

  const createReturnRequest = useCallback(
    ({ orderId, item, reason }) => {
      const ret = {
        id: uid(),
        createdAt: new Date().toISOString(),
        orderId,
        item,
        reason: reason || 'Không phù hợp',
        status: 'REQUESTED',
      }
      act({ type: 'return/create', returnRequest: ret })
      return ret
    },
    [act],
  )

  const value = useMemo(
    () => ({
      vouchers: VOUCHERS,
      cart: state.cart,
      orders: state.orders,
      returns: state.returns,

      cartItemsCount,
      pricing: {
        subtotal,
        discount,
        total,
        subtotalText: formatPrice(subtotal),
        discountText: formatPrice(discount),
        totalText: formatPrice(total),
      },

      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,

      setVoucherCode,
      applyVoucher,

      createOrder,
      mergeServerOrder,
      createReturnRequest,
    }),
    [
      state,
      cartItemsCount,
      subtotal,
      discount,
      total,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      setVoucherCode,
      applyVoucher,
      createOrder,
      mergeServerOrder,
      createReturnRequest,
    ],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}

