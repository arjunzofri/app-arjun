import { neon } from "@neondatabase/serverless";

const FALLBACK_VISA_CORTE = 26194159;

export async function getVisaCorte(): Promise<number> {
  try {
    const s = neon(process.env.DATABASE_URL!);
    const rows = await s`
      SELECT ultimo_numero_visa FROM sync_winfac_log ORDER BY id DESC LIMIT 1
    `;
    const corte = Number(rows[0]?.ultimo_numero_visa) || 0;
    return corte > 0 ? corte : FALLBACK_VISA_CORTE;
  } catch {
    return FALLBACK_VISA_CORTE;
  }
}
