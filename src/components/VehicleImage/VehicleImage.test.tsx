import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VehicleImage from '@/components/VehicleImage/VehicleImage'
import { VEHICLE_IMAGE_KEYS } from '@/services/schemas/vehicle'

describe('VehicleImage', () => {
  it.each(VEHICLE_IMAGE_KEYS)('draws the %s as a decorative picture', (image) => {
    const { container } = render(<VehicleImage image={image} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg?.querySelectorAll('path, rect, circle').length).toBeGreaterThan(2)
  })

  it('draws a different picture for each vehicle type', () => {
    const drawings = VEHICLE_IMAGE_KEYS.map((image) => {
      const { container, unmount } = render(<VehicleImage image={image} />)
      const markup = container.innerHTML
      unmount()
      return markup
    })

    expect(new Set(drawings).size).toBe(VEHICLE_IMAGE_KEYS.length)
  })

  it('accepts an extra class for sizing', () => {
    const { container } = render(<VehicleImage image="van" className="custom" />)

    expect(container.querySelector('svg')).toHaveClass('custom')
  })
})
