// Sideways chip rows hide their scrollbar, which is fine with a finger but
// leaves a mouse or trackpad stuck. Pass `ref={scrollRow}` to a row and:
// - a mouse wheel (or an up/down trackpad swipe) scrolls it sideways,
// - a mouse can drag it,
// - `can-left` / `can-right` classes say there's more, for the edge fade.
// A React 19 ref callback: the function it returns detaches everything.

const DRAG_THRESHOLD = 6

export function scrollRow(el: HTMLElement | null) {
  if (!el) return

  const update = () => {
    const max = el.scrollWidth - el.clientWidth
    el.classList.toggle('can-left', el.scrollLeft > 1)
    el.classList.toggle('can-right', el.scrollLeft < max - 1)
  }

  const onWheel = (e: WheelEvent) => {
    const max = el.scrollWidth - el.clientWidth
    // Sideways gestures already scroll it; only redirect up/down turns.
    if (max <= 0 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    const step = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * el.clientWidth : e.deltaY
    // At either end, let the page or sheet have the scroll.
    if ((step > 0 && el.scrollLeft >= max - 1) || (step < 0 && el.scrollLeft <= 0)) return
    e.preventDefault()
    el.scrollLeft += step
  }

  let drag: { x: number; left: number; moved: boolean } | null = null
  let justDragged = false

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth) return
    drag = { x: e.clientX, left: el.scrollLeft, moved: false }
  }
  const onMove = (e: PointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.x
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD) return
    if (!drag.moved) {
      drag.moved = true
      el.setPointerCapture(e.pointerId)
      el.classList.add('is-dragging')
    }
    el.scrollLeft = drag.left - dx
  }
  const onUp = () => {
    if (drag?.moved) {
      justDragged = true
      // The click that ends a drag isn't a tap on a chip.
      setTimeout(() => (justDragged = false), 0)
    }
    drag = null
    el.classList.remove('is-dragging')
  }
  const onClick = (e: MouseEvent) => {
    if (!justDragged) return
    e.preventDefault()
    e.stopPropagation()
  }

  const resize = new ResizeObserver(update)
  resize.observe(el)
  // Chips come and go (search filters), which changes how far it scrolls.
  const children = new MutationObserver(update)
  children.observe(el, { childList: true, subtree: true })

  el.addEventListener('scroll', update, { passive: true })
  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
  el.addEventListener('click', onClick, true)
  update()

  return () => {
    resize.disconnect()
    children.disconnect()
    el.removeEventListener('scroll', update)
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
    el.removeEventListener('click', onClick, true)
  }
}
