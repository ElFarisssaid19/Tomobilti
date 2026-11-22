import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CarImage from './CarImage.jsx'

const photoCar = {
  brand: { name: 'Dacia' },
  model: 'Logan',
  category: { name: 'Économique', slug: 'economique' },
  images: [
    {
      url: 'http://localhost:8000/storage/cars/dacia-logan-2024/01-avant-trois-quarts-1600.webp',
      thumbnail_url:
        'http://localhost:8000/storage/cars/dacia-logan-2024/01-avant-trois-quarts-800.webp',
      alt: 'Dacia Logan 2024, vue avant trois-quarts',
      is_primary: true,
    },
  ],
}

describe('CarImage', () => {
  it('lazy-loads a photo with its 800w/1600w srcset and shows a skeleton until it loads', () => {
    const { container } = render(<CarImage car={photoCar} />)

    const image = screen.getByRole('img', { name: 'Dacia Logan 2024, vue avant trois-quarts' })
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute('width', '800')
    expect(image).toHaveAttribute('height', '500')
    expect(image.getAttribute('srcset')).toContain('-800.webp 800w')
    expect(image.getAttribute('srcset')).toContain('-1600.webp 1600w')
    expect(container.querySelector('.skeleton')).toBeInTheDocument()

    fireEvent.load(image)

    expect(container.querySelector('.skeleton')).not.toBeInTheDocument()
  })

  it('falls back to the local silhouette when the photo fails to load', () => {
    const { container } = render(<CarImage car={photoCar} />)
    const image = container.querySelector('img')

    fireEvent.error(image)

    expect(image.getAttribute('src')).not.toContain('localhost:8000')
    expect(image).toHaveAttribute('alt', '')
    expect(image).not.toHaveAttribute('srcset')
    expect(container.querySelector('.skeleton')).not.toBeInTheDocument()
  })

  it('treats an SVG from the API as a decorative placeholder', () => {
    const { container } = render(
      <CarImage
        car={{ ...photoCar, images: [{ url: '/storage/cars/placeholders/dacia-logan-2024.svg' }] }}
      />,
    )
    const image = container.querySelector('img')

    expect(image).toHaveAttribute('alt', '')
    expect(image).toHaveClass('object-contain')
    expect(container.querySelector('.skeleton')).not.toBeInTheDocument()
  })
})
