export function formatDescripcionCorta(descripcion: string): string {
  const extract = (key: string) => {
    const match = descripcion.match(new RegExp(`${key}:\\s*([^;]+);`))
    return match ? match[1].trim() : null
  }

  const nombre = extract("NOMBRE")
  const marca = extract("MARCA")
  const modelo = extract("MODELO")

  return [nombre, marca, modelo].filter(Boolean).join(" · ")
}
