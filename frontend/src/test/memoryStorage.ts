/**
 * In-memory `Storage` voor tests die `localStorage` moeten kunnen lezen én schrijven: de
 * `localStorage` die deze testomgeving levert, mist o.a. `setItem`/`clear`. Gebruik met
 * `vi.stubGlobal('localStorage', memoryStorage())` en `vi.unstubAllGlobals()` in `afterEach`.
 */
export function memoryStorage(): Storage {
  const items = new Map<string, string>()

  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  }
}
