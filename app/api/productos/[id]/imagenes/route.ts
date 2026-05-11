import { NextResponse } from "next/server";
import { db } from "@/db";
import { productoImagenes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  // Eliminar imágenes previas del producto
  const existing = await db.query.productoImagenes.findMany({
    where: eq(productoImagenes.productoId, id),
  });
  for (const img of existing) {
    if (img.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(img.cloudinaryPublicId);
    }
  }
  if (existing.length > 0) {
    await db.delete(productoImagenes).where(eq(productoImagenes.productoId, id));
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "productos",
    resource_type: "image",
  });

  const [imagen] = await db.insert(productoImagenes).values({
    productoId: id,
    url: result.secure_url,
    cloudinaryPublicId: result.public_id,
  }).returning();

  return NextResponse.json(imagen, { status: 201 });
}
