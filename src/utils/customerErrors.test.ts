import { describe, expect, it } from 'vitest'
import { checkoutErrorMessage } from './customerErrors'

describe('customer checkout errors', () => {
  it('gives actionable guidance for recognized checkout conditions', () => {
    expect(checkoutErrorMessage(new Error('No proof'))).toContain('upload your payment proof')
    expect(checkoutErrorMessage(new Error('Stock is no longer available'))).toContain('review your cart')
  })

  it('never exposes arbitrary service, storage, or database errors', () => {
    const fallback = checkoutErrorMessage(null)
    for (const error of [
      new Error('Supabase migration missing: reserve_cart_stock'),
      new Error('permission denied for table orders'),
      new Error('Order was created but no order reference was returned.'),
      { message: 'Bucket not found', details: 'Internal configuration' },
      'Network error at internal endpoint',
    ]) {
      expect(checkoutErrorMessage(error)).toBe(fallback)
    }
  })
})
