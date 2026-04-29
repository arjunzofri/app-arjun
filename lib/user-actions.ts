"use server";

import { db } from "@/db";
import { usuarios, activityLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { UsuarioSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createOrUpdateUsuario(data: any) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") throw new Error("Acceso denegado");

  const validated = UsuarioSchema.parse(data);
  const id = data.id;

  if (id) {
    const payload: any = {
      nombre: validated.nombre,
      email: validated.email,
      rol: validated.rol,
      updatedAt: new Date(),
    };

    if (validated.password) {
      payload.passwordHash = await bcrypt.hash(validated.password, 10);
    }

    await db.update(usuarios).set(payload).where(eq(usuarios.id, id));

  } else {
    if (!validated.password) throw new Error("Contraseña requerida para nuevo usuario");
    
    const passwordHash = await bcrypt.hash(validated.password, 10);

    await db.insert(usuarios).values({
      nombre: validated.nombre,
      email: validated.email,
      passwordHash,
      rol: validated.rol,
    });
  }

  revalidatePath("/usuarios");
}

export async function eliminarUsuario(id: string) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") throw new Error("Acceso denegado");
  
  await db.delete(usuarios).where(eq(usuarios.id, id));
  revalidatePath("/usuarios");
}
