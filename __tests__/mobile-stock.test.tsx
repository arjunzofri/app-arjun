import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BuscadorProducto } from '@/components/mobile/BuscadorProducto'
import { InputCantidad } from '@/components/mobile/InputCantidad'

describe('Stock móvil — componentes', () => {
  const productos = [
    { id: '1', codigo: 'K-001', descripcion: 'Cargador 20W', imagen: null },
    { id: '2', codigo: 'K-002', descripcion: 'Audífonos BT', imagen: null },
  ]

  it('BuscadorProducto muestra resultados para búsqueda por código en stock', () => {
    render(<BuscadorProducto productos={productos} onSelect={vi.fn()} selected={null} />)
    fireEvent.change(screen.getByPlaceholderText(/buscar producto/i), { target: { value: 'k-00' } })
    expect(screen.getByText('K-001')).toBeTruthy()
    expect(screen.getByText('K-002')).toBeTruthy()
  })

  it('InputCantidad muestra conversión a cajas con packing 10', () => {
    render(<InputCantidad value={45} onChange={vi.fn()} packing={10} max={100} />)
    expect(screen.getByText(/4 cajas \+ 5 unidades/)).toBeTruthy()
  })

  it('InputCantidad no muestra conversión cuando packing = 1', () => {
    const { container } = render(<InputCantidad value={5} onChange={vi.fn()} packing={1} max={100} />)
    expect(container.textContent).not.toContain('cajas')
  })
})
