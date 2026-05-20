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

  it('renderiza solo el link Salidas', () => {
    render(<MobileNav />)
    expect(screen.getByText('Salidas')).toBeTruthy()
  })

  it('el link Salidas apunta a /salidas', () => {
    render(<MobileNav />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/salidas')
  })

  it('renderiza botón Salir', () => {
    render(<MobileNav />)
    expect(screen.getByText('Salir')).toBeTruthy()
  })

  it('marca como activa la ruta actual con text-white', () => {
    mockUsePathname.mockReturnValue('/salidas')
    render(<MobileNav />)
    const activo = screen.getByText('Salidas').closest('a')
    expect(activo?.className).toContain('text-white')
  })

  it('no muestra Stock ni Inicio', () => {
    render(<MobileNav />)
    expect(screen.queryByText('Stock')).toBeNull()
    expect(screen.queryByText('Inicio')).toBeNull()
  })
})
