import { useEffect, useMemo, useState } from 'react'

const slideModules = import.meta.glob('../../images/*.{png,jpg,jpeg,webp,gif,svg,jfif}', {
  eager: true,
  import: 'default',
})

const slides = Object.entries(slideModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

const SLOGAN = 'HTShoes - nâng niu bàn chân Việt'

export default function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasSlides = slides.length > 0

  useEffect(() => {
    if (!hasSlides) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [hasSlides])

  const currentSlide = useMemo(() => {
    if (!hasSlides) return null
    return slides[activeIndex]
  }, [activeIndex, hasSlides])

  return (
    <section className="hero-banner card" aria-label="HTShoes hero banner">
      {currentSlide ? <img className="hero-banner-image" src={currentSlide} alt="HTShoes banner" /> : null}
      <div className="hero-banner-overlay">
        <p className="hero-banner-subtitle">HTShoes</p>
        <h2>{SLOGAN}</h2>
        {!hasSlides ? (
          <p className="hero-banner-note">Them anh vao thu muc frontend/images de hien thi slideshow.</p>
        ) : null}
      </div>
      {hasSlides ? (
        <div className="hero-banner-dots" aria-hidden="true">
          {slides.map((_, idx) => (
            <span key={idx} className={`hero-dot${idx === activeIndex ? ' active' : ''}`} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
