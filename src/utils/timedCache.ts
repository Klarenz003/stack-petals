export const STOREFRONT_CACHE_MS = 120_000

/** In-memory public data cache; only successful responses are cached. */
export function createTimedCache<K, T>(ttl = STOREFRONT_CACHE_MS) {
  const entries = new Map<K, { value: T; expires: number }>()
  const pending = new Map<K, Promise<T>>()
  return {
    peek: (key: K) => entries.get(key)?.value,
    isFresh: (key: K) => (entries.get(key)?.expires ?? 0) > Date.now(),
    load(key: K, fetcher: () => Promise<T>, force = false): Promise<T> {
      const running = pending.get(key)
      if (running) return running
      const cached = entries.get(key)
      if (!force && cached && cached.expires > Date.now()) return Promise.resolve(cached.value)
      const request = Promise.resolve().then(fetcher).then(value => {
        entries.set(key, { value, expires: Date.now() + ttl })
        return value
      }).finally(() => pending.delete(key))
      pending.set(key, request)
      return request
    },
  }
}
