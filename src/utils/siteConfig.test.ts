import { describe, expect, it } from 'vitest'
import { siteUrl, supportUrl } from './siteConfig'

describe('site configuration links', () => {
  it('normalizes paths against the configured public site', () => {
    expect(siteUrl('/contact')).toMatch(/\/contact$/)
  })

  it('encodes support details for donation links', () => {
    const url = new URL(supportUrl(50))
    expect(url.pathname).toBe('/contact')
    expect(url.searchParams.get('subject')).toBe('Support Stack Petals')
    expect(url.searchParams.get('amount')).toBe('50')
  })
})
