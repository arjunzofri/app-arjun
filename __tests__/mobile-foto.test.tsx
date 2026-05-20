import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BotonFoto } from '@/components/mobile/BotonFoto'

describe('BotonFoto', () => {
  it('renderiza el botón de Foto con ícono de cámara', () => {
    const { container } = render(<BotonFoto productoId="uuid-test" />)
    expect(screen.getByText('Foto')).toBeTruthy()
    const btn = container.querySelector('button')
    expect(btn).toBeTruthy()
  })

  it('contiene un input file oculto con capture=environment', () => {
    const { container } = render(<BotonFoto productoId="uuid-test" />)
    const input = container.querySelector('input[type="file"]')
    expect(input).toBeTruthy()
    expect(input?.getAttribute('accept')).toBe('image/*')
    expect(input?.getAttribute('capture')).toBe('environment')
  })
})
