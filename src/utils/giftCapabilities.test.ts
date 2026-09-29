import { describe, expect, it } from 'vitest'
import { getGiftCapabilities } from './giftCapabilities'

describe('getGiftCapabilities', () => {
  it('normalizes database fields', () => {
    expect(getGiftCapabilities({ has_photo_upload: false, has_360_view: true })).toEqual({
      hasPhotoUpload: false,
      has360View: true,
    })
  })

  it('supports local storage field names', () => {
    expect(getGiftCapabilities({ hasPhotoUpload: false, has360Viewer: true })).toEqual({
      hasPhotoUpload: false,
      has360View: true,
    })
  })

  it('keeps photo uploads enabled for legacy claims without a flag', () => {
    expect(getGiftCapabilities({})).toEqual({ hasPhotoUpload: true, has360View: false })
  })
})
