import { describe, expect, it, vi } from 'vitest'
vi.mock('@/supabaseClient', () => ({ supabase: { functions: { invoke: vi.fn() } } }))
import { reportStorefrontError, safeErrorCode } from './errorTracker'
import { supabase } from '@/supabaseClient'

describe('private error diagnostics', () => {
  it('retains only recognized diagnostic codes', () => {
    expect(safeErrorCode({ code: '42501', message: 'private message' })).toBe('42501')
    expect(safeErrorCode({ code: 'PGRST202' })).toBe('PGRST202')
    expect(safeErrorCode(new TypeError('customer@example.com'))).toBe('TypeError')
  })
  it('discards arbitrary content and identifiers', () => {
    for (const value of [null, 'secret', { code: 'customer@example.com' }, { name: 'private name' }]) {
      expect(safeErrorCode(value)).toBe('UNKNOWN')
    }
  })
  it('omits private routes and payloads and suppresses repeated errors', () => {
    vi.stubGlobal('location', { pathname: '/gift/create/private-qr-token', search: '?email=customer@example.com' })
    vi.stubGlobal('localStorage', { getItem: () => 'CA' })
    vi.stubGlobal('innerWidth', 390)
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: null })
    reportStorefrontError('letter.publish', new TypeError('secret letter content'))
    reportStorefrontError('letter.publish', new TypeError('secret letter content'))
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1)
    expect(supabase.functions.invoke).toHaveBeenCalledWith('report-storefront-error', {
      body: { operation: 'letter.publish', code: 'TypeError', page: 'gift', market: 'CA', device: 'mobile' },
    })
    vi.unstubAllGlobals()
  })
})
