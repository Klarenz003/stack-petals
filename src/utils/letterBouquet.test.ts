import { describe, expect, it } from 'vitest'
import { bouquetKey, getLetterBouquetAssets, selectLetterBouquet } from './letterBouquet'
const items = [
  { id: 'plain', name: 'Plain', image: '/plain.jpg', price: '1', quantity: 1 },
  { id: 'rose', name: 'Rose', image: '/rose.jpg', price: '2', quantity: 1, has360Viewer: true },
  { id: 'tulip', name: 'Tulip', image: '/tulip.jpg', price: '3', quantity: 1, has360Viewer: true },
]
describe('letter bouquet selection', () => {
  it('shows uploaded standalone turns even when the QR capability was disabled', () => {
    expect(getLetterBouquetAssets({ order_id: null, has_360_view: false, angle_photos: ['/1.png', '/2.png'] }).has360View).toBe(true)
    expect(getLetterBouquetAssets({ letter_v2_qr_id: 'qr', has_360_view: false, angle_photos: ['/1.png', '/2.png'] }).has360View).toBe(true)
    expect(getLetterBouquetAssets({ order_id: 'order', has_360_view: false, angle_photos: ['/1.png', '/2.png'] }).has360View).toBe(false)
  })
  it('hides standalone 360 controls when frames are absent or removed', () => {
    expect(getLetterBouquetAssets({ order_id: null, has_360_view: true, angle_photos: [] }).has360View).toBe(false)
    expect(getLetterBouquetAssets({ order_id: null, has_360_view: true, angle_photos: ['', ' '] }).has360View).toBe(false)
  })
  it('selects exactly one eligible purchased bouquet', () => {
    expect(selectLetterBouquet(items, 'tulip')).toBe(items[2])
    expect(selectLetterBouquet(items, 'plain')).toBe(items[1])
  })
  it('recovers removed selections and automatically selects a single bouquet', () => {
    expect(selectLetterBouquet(items, 'removed')).toBe(items[1])
    expect(selectLetterBouquet([items[2]], '')).toBe(items[2])
    expect(selectLetterBouquet([items[0]], '')).toBe(items[0])
    expect(selectLetterBouquet([], '')).toBeUndefined()
    expect(bouquetKey({ name: 'Legacy bouquet' })).toBe('Legacy bouquet')
  })
  it('does not enable a viewer without actual admin frames', () => {
    expect(getLetterBouquetAssets({ has_360_view: true }).has360View).toBe(false)
    expect(getLetterBouquetAssets({ angle_photos: ['/1.png'] }).has360View).toBe(false)
    expect(getLetterBouquetAssets({ has_360_view: false, angle_photos: ['/1.png', '/2.png'] }).has360View).toBe(false)
  })
  it('keeps the admin frame order and separates bouquet photos from memories', () => {
    expect(getLetterBouquetAssets({ bouquet_image_url: 'bouquet.jpg', memories: ['/memory.png'], angle_photos: ['2.png', '1.png'] })).toEqual({
      image: '/bouquet.jpg', frames: ['/2.png', '/1.png'], has360View: true,
    })
    expect(getLetterBouquetAssets({ memories: ['/memory.png'] }).image).toBe('')
  })
})
