"use server";

import { db } from "@/db";
import { usuarios, activityLog, entradas, salidas, traslados, codigoPersonalAuditoria } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { UsuarioSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createOrUpdateUsuario(data: any) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return { error: "Acceso denegado" };

  const parsed = UsuarioSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos" };
  const validated = parsed.data;
  const id = data.id;

  try {
    if (id) {
      const payload: any = {
        nombre: validated.nombre,
        username: validated.username,
        email: validated.email,
        rol: validated.rol,
        updatedAt: new Date(),
      };

      if (validated.password) {
        payload.passwordHash = await bcrypt.hash(validated.password, 10);
      }

      await db.update(usuarios).set(payload).where(eq(usuarios.id, id));

    } else {
      if (!validated.password) return { error: "Contraseña requerida para nuevo usuario" };

      const passwordHash = await bcrypt.hash(validated.password, 10);

      await db.insert(usuarios).values({
        nombre: validated.nombre,
        username: validated.username,
        email: validated.email,
        passwordHash,
        rol: validated.rol,
      });
    }

    revalidatePath("/usuarios");
    return { success: true };
  } catch (error) {
    console.error('createOrUpdateUsuario error:', error)
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function eliminarUsuario(id: string) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return { error: "Acceso denegado" };
  }

  // Verificar que no se esté borrando a sí mismo
  if (session.user?.id === id) {
    return { error: "No puedes eliminar tu propio usuario" };
  }

  // Verificar que no sea el último administrador
  const admins = await db.query.usuarios.findMany({
    where: eq(usuarios.rol, "admin"),
  });
  const esAdmin = admins.some(u => u.id === id);
  if (esAdmin && admins.length <= 1) {
    return { error: "No se puede eliminar al último administrador" };
  }

  // Verificar que no tenga movimientos registrados (FK constraints)
  const [tieneEntradas, tieneSalidas, tieneTraslados, tieneActivity, tieneCodigos] = await Promise.all([
    db.query.entradas.findFirst({ where: eq(entradas.usuarioId, id) }),
    db.query.salidas.findFirst({ where: eq(salidas.usuarioId, id) }),
    db.query.traslados.findFirst({ where: eq(traslados.usuarioId, id) }),
    db.query.activityLog.findFirst({ where: eq(activityLog.usuarioId, id) }),
    db.query.codigoPersonalAuditoria.findFirst({ where: eq(codigoPersonalAuditoria.usuarioId, id) }),
  ]);

  if (tieneEntradas || tieneSalidas || tieneTraslados || tieneActivity || tieneCodigos) {
    return { error: "No se puede eliminar un usuario con movimientos registrados" };
  }

  await db.delete(usuarios).where(eq(usuarios.id, id));
  revalidatePath("/usuarios");
  return { success: true };
}
