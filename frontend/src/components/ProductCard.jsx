import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'

export default function ProductCard({ product }) {
  const fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-media">
        <img src={product.imageUrl || fallbackImage} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-content">
        <p className="product-category">{product.category || 'General'}</p>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-description">{product.description || 'San pham chat luong cao.'}</p>
        <div className="product-footer">
          <strong>{formatPrice(product.price)}</strong>
          <Link to={`/products/${product.id}`} className="text-link">
            Chi tiet
          </Link>
        </div>
      </div>
    </article>
  )
}
