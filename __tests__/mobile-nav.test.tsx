import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileNav } from '@/components/layout/MobileNav'

const mockUsePathname = vi.fn(() => '/salidas')

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock('@/app/actions/auth-actions', () => ({
  logout: vi.fn(),
}))

describe('MobileNav — navegación móvil', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/salidas')
  })

  it('renderiza 2 links: Salidas y Stock', () => {
    render(<MobileNav />)
    expect(screen.getByText('Salidas')).toBeTruthy()
    expect(screen.getByText('Stock')).toBeTruthy()
  })

  it('los 2 links apuntan a las rutas correctas', () => {
    render(<MobileNav />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/salidas')
    expect(hrefs).toContain('/mobile/stock')
  })

  it('renderiza botón Salir', () => {
    render(<MobileNav />)
    expect(screen.getByText('Salir')).toBeTruthy()
  })

  it('marca como activa la ruta actual', () => {
    mockUsePathname.mockReturnValue('/salidas')
    render(<MobileNav />)
    const activo = screen.getByText('Salidas').closest('a')
    const inactivo = screen.getByText('Stock').closest('a')
    expect(activo?.className).toContain('adc8f5')
    expect(inactivo?.className).not.toContain('adc8f5')
  })

  it('no muestra Inicio', () => {
    render(<MobileNav />)
    expect(screen.queryByText('Inicio')).toBeNull()
  })
})
