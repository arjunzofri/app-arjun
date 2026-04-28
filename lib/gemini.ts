import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function analyzeInvoice(imageBuffer: Buffer, mimeType: string) {
  const prompt = `Analiza esta nota de venta de Kingnex. Extrae en formato JSON:
{
"numero_nv": "string",
"fecha": "YYYY-MM-DD",
"items": [
{ "sku": "string", "descripcion": "string", "cantidad": number, "precio_unitario": number }
]
}
Solo responde con el JSON, sin explicaciones.`;

  const result = await geminiModel.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType,
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();
  
  // Clean potential markdown blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error("No se pudo extraer JSON de la respuesta de Gemini");
}
