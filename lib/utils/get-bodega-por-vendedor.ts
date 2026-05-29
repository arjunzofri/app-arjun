const BODEGA_VIDA_DIGITAL_1 = "e9a760f0-6a29-4b38-bc9b-d94d55d3f272"
const BODEGA_ARJUN = "8c18bacf-698c-443f-b5ae-6a40e22bbe7e"
const RUTS_VIDA_DIGITAL = ["77854664", "76254375"]

export function getBodegaPorVendedor(vendedorRut: string | null): string {
  if (vendedorRut && RUTS_VIDA_DIGITAL.includes(vendedorRut)) {
    return BODEGA_VIDA_DIGITAL_1
  }
  return BODEGA_ARJUN
}
