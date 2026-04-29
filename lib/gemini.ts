import { GoogleGenAI } from "@google/genai";

export async function analyzeInvoice(imageBase64: string, mimeType: string) {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const prompt = `Analiza esta nota de venta de Kingnex. Extrae en formato JSON:
{
  "numero_nv": "string",
  "fecha": "YYYY-MM-DD",
  "items": [
    { "sku": "string", "descripcion": "string", "cantidad": number, "precio_unitario": number }
  ]
}
Solo responde con el JSON, sin explicaciones.`;

  const result = await genAI.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
        ],
      },
    ],
  });

  const text = result.text ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("No se pudo extraer JSON de la respuesta de Gemini");
}
