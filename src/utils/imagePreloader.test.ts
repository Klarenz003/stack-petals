import { describe, expect, it, vi } from 'vitest'
import { preloadImageSources } from './imagePreloader'

describe('preloadImageSources', () => {
  it('ignores empty values and loads each source once', async () => {
    const loader = vi.fn().mockResolvedValue(undefined)

    const result = await preloadImageSources(['', '/one.png', '/one.png', '/two.png'], { loader })

    expect(loader).toHaveBeenCalledTimes(2)
    expect(loader).toHaveBeenNthCalledWith(1, '/one.png')
    expect(loader).toHaveBeenNthCalledWith(2, '/two.png')
    expect(result).toEqual({ loaded: 2, failed: 0, total: 2 })
  })

  it('keeps loading and reports progress when an image fails', async () => {
    const loader = vi.fn(async (src: string) => {
      if (src === '/broken.png') throw new Error('broken image')
    })
    const progress = vi.fn()

    const result = await preloadImageSources(['/one.png', '/broken.png', '/two.png'], {
      loader,
      concurrency: 2,
      onProgress: progress,
    })

    expect(result).toEqual({ loaded: 2, failed: 1, total: 3 })
    expect(progress).toHaveBeenCalledTimes(3)
    expect(progress).toHaveBeenLastCalledWith(expect.objectContaining({ completed: 3, total: 3 }))
  })
})
