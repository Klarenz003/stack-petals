export const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')

export function siteUrl(path = ''): string {
  return `${PUBLIC_SITE_URL}/${path.replace(/^\//, '')}`
}

export function supportUrl(amount: number): string {
  const params = new URLSearchParams({ subject: 'Support Stack Petals', amount: String(amount) })
  return siteUrl(`/contact?${params.toString()}`)
}
