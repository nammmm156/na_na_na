import { useEffect, useMemo, useState } from 'react'

const SLIDE_MS = 4500

export default function HeroCarousel() {
  const slides = useMemo(
    () => [
      { src: '/image/image_1.jpg', alt: 'HTshoes hero 1' },
      { src: '/image/imge_2.jfif', alt: 'HTshoes hero 2' },
      { src: '/image/imge_3.jfif', alt: 'HTshoes hero 3' },
    ],
    [],
  )

  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(t)
  }, [slides.length])

  return (
    <section className="hero-carousel" aria-label="HTShoes slideshow">
      <div className="hero-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {slides.map((s) => (
          <div key={s.src} className="hero-slide">
            <img src={s.src} alt={s.alt} loading="eager" />
            <div className="hero-overlay" />
            <div className="hero-content container">
              <h2>HTshoes</h2>
              <p>HTshoes - Nâng niu bàn chân Việt</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

