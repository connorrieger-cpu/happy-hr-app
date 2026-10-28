// Liquid-glass refraction. Only Chromium supports SVG filters inside
// backdrop-filter; elsewhere the whole declaration would be dropped (losing the
// blur too), so the effect is opt-in via a class on <html>.

export function enableRefraction() {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands
  if (brands?.some((b) => b.brand === 'Chromium')) {
    document.documentElement.classList.add('supports-refraction')
  }
}

/** A soft, low-frequency displacement that bends the map behind small glass controls. */
export function RefractionFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="liquid-refraction" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves="2" seed="11" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2.5" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="22" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
