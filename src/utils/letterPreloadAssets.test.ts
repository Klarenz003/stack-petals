import { describe, expect, it } from 'vitest'
import { getLetterCriticalImageSources } from './letterPreloadAssets'

describe('getLetterCriticalImageSources', () => {
  it('includes the bouquet, memories, and keepsafe artwork without heavy angle frames', () => {
    const sources = getLetterCriticalImageSources({
      bouquetImage: '/bouquet.png',
      memories: ['/memory-one.png', '/memory-two.png'],
      anglePhotos: ['/angle-one.png', '/angle-two.png'],
    })

    expect(sources).toContain('/bouquet.png')
    expect(sources).toContain('/memory-one.png')
    expect(sources).toContain('/images/keepsake-letter.png')
    expect(sources).toContain('/images/keepsake-music.png')
    expect(sources).not.toContain('/angle-one.png')
  })
})
