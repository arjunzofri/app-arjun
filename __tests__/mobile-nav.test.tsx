import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileNav } from '@/components/layout/MobileNav'

const mockUsePathname = vi.fn(() => '/')

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('MobileNav — navegación móvil', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('renderiza 3 opciones: Inicio, Salidas, Stock', () => {
    render(<MobileNav />)
    expect(screen.getByText('Inicio')).toBeTruthy()
    expect(screen.getByText('Salidas')).toBeTruthy()
    expect(screen.getByText('Stock')).toBeTruthy()
  })

  it('los 3 links apuntan a las rutas correctas', () => {
    render(<MobileNav />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/salidas')
    expect(hrefs).toContain('/mobile/stock')
  })

  it('marca como activa la ruta actual', () => {
    mockUsePathname.mockReturnValue('/salidas')
    render(<MobileNav />)
    const activo = screen.getByText('Salidas').closest('a')
    const inactivo = screen.getByText('Inicio').closest('a')
    expect(activo?.className).toContain('adc8f5')
    expect(inactivo?.className).not.toContain('adc8f5')
  })
})
