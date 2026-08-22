export type ImageSourceLoader = (src: string) => Promise<void>

export interface ImagePreloadProgress {
  completed: number
  loaded: number
  failed: number
  total: number
  src: string
  status: 'loaded' | 'failed'
}

export interface ImagePreloadResult {
  loaded: number
  failed: number
  total: number
}

export interface ImagePreloadOptions {
  concurrency?: number
  loader?: ImageSourceLoader
  onProgress?: (progress: ImagePreloadProgress) => void
}

export function uniqueImageSources(srcs: Array<string | null | undefined>) {
  return [...new Set(srcs.map(src => src?.trim()).filter((src): src is string => Boolean(src)))]
}

export function loadBrowserImage(src: string, timeoutMs = 10_000) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image()
    let settled = false
    const timeout = window.setTimeout(() => finish(new Error(`Image timed out: ${src}`)), timeoutMs)

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      image.onload = null
      image.onerror = null
      if (error) reject(error)
      else resolve()
    }

    image.onload = async () => {
      try {
        await image.decode()
      } catch {
        // The decoded pixels are normally available after onload, even when decode is unsupported.
      }
      finish()
    }
    image.onerror = () => finish(new Error(`Image failed to load: ${src}`))
    image.loading = 'eager'
    image.decoding = 'async'
    image.src = src
  })
}

export async function preloadImageSources(
  inputSources: Array<string | null | undefined>,
  options: ImagePreloadOptions = {},
): Promise<ImagePreloadResult> {
  const sources = uniqueImageSources(inputSources)
  const loader = options.loader ?? loadBrowserImage
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, sources.length || 1))
  const result: ImagePreloadResult = { loaded: 0, failed: 0, total: sources.length }
  let nextIndex = 0

  const worker = async () => {
    while (nextIndex < sources.length) {
      const src = sources[nextIndex++]
      let status: ImagePreloadProgress['status'] = 'loaded'
      try {
        await loader(src)
        result.loaded += 1
      } catch {
        status = 'failed'
        result.failed += 1
      }

      options.onProgress?.({
        completed: result.loaded + result.failed,
        loaded: result.loaded,
        failed: result.failed,
        total: result.total,
        src,
        status,
      })
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return result
}
