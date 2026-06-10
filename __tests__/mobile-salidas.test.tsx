import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BuscadorProducto } from '@/components/mobile/BuscadorProducto'
import { BotonesModulo } from '@/components/mobile/BotonesModulo'
import { InputCantidad } from '@/components/mobile/InputCantidad'

const productoBase = {
  id: 'uuid-1',
  codigo: 'K-001',
  descripcion: 'Cargador Rápido 20W',
  imagen: null,
}

describe('BuscadorProducto', () => {
  const productos = [
    productoBase,
    { id: 'uuid-2', codigo: 'K-002', descripcion: 'Audífonos Bluetooth', imagen: null },
    { id: 'uuid-3', codigo: 'Z-999', descripcion: 'Cable USB-C 2m', imagen: null },
  ]

  it('renderiza el input de búsqueda', () => {
    render(<BuscadorProducto productos={productos} onSelect={vi.fn()} selected={null} />)
    expect(screen.getByPlaceholderText(/buscar producto/i)).toBeTruthy()
  })

  it('filtra productos al escribir', () => {
    const onSelect = vi.fn()
    render(<BuscadorProducto productos={productos} onSelect={onSelect} selected={null} />)
    const input = screen.getByPlaceholderText(/buscar producto/i)
    fireEvent.change(input, { target: { value: 'carg' } })
    expect(screen.getByText('K-001')).toBeTruthy()
    expect(screen.queryByText('K-002')).toBeFalsy()
    expect(screen.queryByText('Z-999')).toBeFalsy()
  })

  it('llama onSelect al clickear un resultado', () => {
    const onSelect = vi.fn()
    render(<BuscadorProducto productos={productos} onSelect={onSelect} selected={null} />)
    fireEvent.change(screen.getByPlaceholderText(/buscar producto/i), { target: { value: 'carg' } })
    const item = screen.getByText('K-001')
    fireEvent.pointerDown(item, { clientY: 100 })
    fireEvent.pointerUp(item, { clientY: 100 })
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'uuid-1', codigo: 'K-001' }))
  })

  it('muestra el producto seleccionado con chip', () => {
    render(<BuscadorProducto productos={productos} onSelect={vi.fn()} selected={productoBase} />)
    expect(screen.getByText('K-001')).toBeTruthy()
    expect(screen.getByText('Cargador Rápido 20W')).toBeTruthy()
  })
})

describe('BotonesModulo', () => {
  const modulos = [
    { id: 'm-180', nombre: 'Módulo 180' },
    { id: 'm-182', nombre: 'Módulo 182' },
    { id: 'm-183', nombre: 'Módulo 183' },
    { id: 'm-184', nombre: 'Módulo 184' },
    { id: 'm-193', nombre: 'Módulo 193' },
  ]

  it('renderiza 5 botones de módulo', () => {
    const { container } = render(<BotonesModulo modulos={modulos} selected={null} onSelect={vi.fn()} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(5)
  })

  it('resalta el módulo seleccionado', () => {
    render(<BotonesModulo modulos={modulos} selected="m-182" onSelect={vi.fn()} />)
    const btn = screen.getByText('182').closest('button')
    expect(btn?.className).toContain('bg-[#1e3a5f]')
  })

  it('llama onSelect al clickear un módulo', () => {
    const onSelect = vi.fn()
    render(<BotonesModulo modulos={modulos} selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('180'))
    expect(onSelect).toHaveBeenCalledWith('m-180')
  })
})

describe('InputCantidad', () => {
  it('renderiza el input numérico', () => {
    render(<InputCantidad value={1} onChange={vi.fn()} packing={1} max={50} />)
    expect(screen.getByDisplayValue('1')).toBeTruthy()
  })

  it('muestra conversión cajas/unidades cuando packing > 1', () => {
    render(<InputCantidad value={25} onChange={vi.fn()} packing={6} max={50} />)
    expect(screen.getByText(/4 cajas \+ 1 unidad/)).toBeTruthy()
  })

  it('muestra stock disponible', () => {
    render(<InputCantidad value={1} onChange={vi.fn()} packing={1} max={50} />)
    expect(screen.getByText(/Stock disponible: 50/)).toBeTruthy()
  })

  it('llama onChange al escribir un valor válido', () => {
    const onChange = vi.fn()
    render(<InputCantidad value={1} onChange={onChange} packing={1} max={50} />)
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '10' } })
    expect(onChange).toHaveBeenCalledWith(10)
  })
})
