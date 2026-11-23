import { useCallback, useSyncExternalStore } from 'react'

/*
 * Favorite cars (slugs) kept in localStorage until accounts can save them. Every
 * component using the hook stays in sync, also across tabs (storage event). Storage
 * can be unavailable (private mode, blocked site data): favorites then live in
 * memory for the visit.
 */

const STORAGE_KEY = 'tomobilti:favorites'
const listeners = new Set()
let memory = []
let cache = { raw: undefined, slugs: [] }

function read() {
  let raw
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return memory
  }
  if (raw === cache.raw) return cache.slugs
  let slugs
  try {
    const parsed = JSON.parse(raw ?? '[]')
    slugs = Array.isArray(parsed) ? parsed.filter((slug) => typeof slug === 'string') : []
  } catch {
    slugs = []
  }
  cache = { raw, slugs }
  return slugs
}

function write(slugs) {
  memory = slugs
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
  } catch {
    // Storage unavailable: the in-memory list is used instead.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  const onStorage = (event) => event.key === STORAGE_KEY && listener()
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

const EMPTY = []

/** @returns {{ favorites: string[], isFavorite: (slug: string) => boolean, toggleFavorite: (car: { slug: string }) => boolean }} */
export default function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => EMPTY)

  const isFavorite = useCallback((slug) => favorites.includes(slug), [favorites])

  /** Adds or removes the car; returns true when it was added. */
  const toggleFavorite = useCallback((car) => {
    const current = read()
    const added = !current.includes(car.slug)
    write(added ? [...current, car.slug] : current.filter((slug) => slug !== car.slug))
    return added
  }, [])

  return { favorites, isFavorite, toggleFavorite }
}
