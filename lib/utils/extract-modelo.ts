export function extractModelo(descripcion: string): string | null {
  const match = descripcion.match(/MODELO:\s*([^;]+);/)
  return match ? match[1].trim() : null
}

export function getCloudinaryVidaDigitalUrl(descripcion: string): string | null {
  const modelo = extractModelo(descripcion)
  if (!modelo) return null
  return `https://res.cloudinary.com/dxkidwxjl/image/upload/productos/${modelo}.jpg`
}

export function getImagenVidaDigital(descripcion: string): string | null {
  return getCloudinaryVidaDigitalUrl(descripcion)
}
