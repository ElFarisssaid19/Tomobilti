import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import usePageMeta from './usePageMeta.js'

function Page() {
  usePageMeta('Nos voitures', 'Toutes les voitures disponibles.')
  return null
}

describe('usePageMeta', () => {
  it('sets the title, the description, the canonical URL and the preview tags', () => {
    render(
      <MemoryRouter initialEntries={['/voitures?categorie=suv&page=2']}>
        <Page />
      </MemoryRouter>,
    )

    const meta = (selector) => document.head.querySelector(selector)?.getAttribute('content')
    expect(document.title).toBe('Nos voitures | Tomobilti')
    expect(meta('meta[name="description"]')).toBe('Toutes les voitures disponibles.')
    expect(meta('meta[property="og:title"]')).toBe('Nos voitures | Tomobilti')
    expect(meta('meta[name="twitter:description"]')).toBe('Toutes les voitures disponibles.')
    // The canonical URL drops the query string: a filtered list points to the list.
    const canonical = document.head.querySelector('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toMatch(/\/voitures$/)
    expect(meta('meta[property="og:url"]')).toBe(canonical)
  })
})
