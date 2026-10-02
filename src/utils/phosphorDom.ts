import { h, render, type Component } from 'vue'

// The cinematic controllers own plain DOM nodes. Clone the SVG and immediately
// unmount Vue's temporary renderer so no component lifecycle is left behind.
export function setIconText(target: Element | null, icon: Component, text = '') {
  if (!target) return
  const host = document.createElement('div')
  render(h(icon, { size: '1em', class: 'ui-icon', 'aria-hidden': 'true' }), host)
  const svg = host.firstElementChild?.cloneNode(true)
  render(null, host)
  target.replaceChildren(...(svg ? [svg] : []), document.createTextNode(text ? ` ${text}` : ''))
}
