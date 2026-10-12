import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFitRows } from '@/hooks/useFitRows'

type Callback = () => void

let trigger: Callback = () => undefined

class FakeResizeObserver {
  constructor(callback: Callback) {
    trigger = callback
  }
  observe = () => undefined
  disconnect = () => undefined
}

function Probe({ height, reserved = 0 }: { height: number; reserved?: number }) {
  const { ref, rows, ready } = useFitRows(36, 5, reserved)
  return (
    <div ref={ref} data-testid="box" data-height={height} data-ready={String(ready)}>
      {rows}
    </div>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFitRows', () => {
  it('uses the fallback when the browser cannot observe sizes', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    render(<Probe height={0} />)

    expect(screen.getByTestId('box')).toHaveTextContent('5')
  })

  it('counts how many whole rows fit in the container', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    render(<Probe height={0} />)
    const box = screen.getByTestId('box')
    Object.defineProperty(box, 'clientHeight', { value: 200, configurable: true })

    act(() => trigger())

    expect(box).toHaveTextContent('5')
    Object.defineProperty(box, 'clientHeight', { value: 110, configurable: true })
    act(() => trigger())
    expect(box).toHaveTextContent('3')
  })

  it('always keeps at least one row', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    render(<Probe height={0} />)
    const box = screen.getByTestId('box')
    Object.defineProperty(box, 'clientHeight', { value: 10, configurable: true })

    act(() => trigger())

    expect(box).toHaveTextContent('1')
  })

  it('keeps the previous value while the container has no size yet', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    render(<Probe height={0} />)
    const box = screen.getByTestId('box')

    act(() => trigger())

    expect(box).toHaveTextContent('5')
  })

  it('discounts the space reserved for a header', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    render(<Probe height={0} reserved={40} />)
    const box = screen.getByTestId('box')
    Object.defineProperty(box, 'clientHeight', { value: 220, configurable: true })

    act(() => trigger())

    expect(box).toHaveTextContent('5')
    Object.defineProperty(box, 'clientHeight', { value: 150, configurable: true })
    act(() => trigger())
    expect(box).toHaveTextContent('3')
  })

  it('is ready at once when the browser cannot observe sizes', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    render(<Probe height={0} />)

    expect(screen.getByTestId('box')).toHaveAttribute('data-ready', 'true')
  })

  it('becomes ready only after the container was measured', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    render(<Probe height={0} />)
    const box = screen.getByTestId('box')
    expect(box).toHaveAttribute('data-ready', 'false')

    Object.defineProperty(box, 'clientHeight', { value: 200, configurable: true })
    act(() => trigger())

    expect(box).toHaveAttribute('data-ready', 'true')
  })
})
