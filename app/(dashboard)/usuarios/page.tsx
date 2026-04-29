import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UsuarioModal from "@/components/usuarios/UsuarioModal"
import { Shield, UserPlus, Mail } from "lucide-react";

export default async function UsuariosPage() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.query.usuarios.findMany({
    orderBy: (u, { desc }) => [desc(u.createdAt)]
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111c2d]">Gestión de Usuarios</h1>
          <p className="text-[#74777f]">Control de acceso y roles para el personal de Arjun.</p>
        </div>
        <UsuarioModal
          trigger={
            <Button className="bg-[#16a34a] font-bold text-white hover:bg-[#15803d]">
              <UserPlus className="mr-2 h-4 w-4" /> Invitar Usuario
            </Button>
          }
        />
      </div>

      <div className="rounded-xl border border-[#c4c6cf] bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-[#c4c6cf]">
              <TableHead className="font-mono text-xs uppercase">Nombre</TableHead>
              <TableHead className="font-mono text-xs uppercase">Email</TableHead>
              <TableHead className="font-mono text-xs uppercase">Rol</TableHead>
              <TableHead className="font-mono text-xs uppercase">Creado</TableHead>
              <TableHead className="text-right font-mono text-xs uppercase">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.map((u) => (
              <TableRow key={u.id} className="border-[#c4c6cf]">
                <TableCell className="font-bold text-[#111c2d]">{u.nombre}</TableCell>
                <TableCell className="text-[#74777f]">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {u.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={u.rol === "admin" ? "bg-[#dbe1ff] text-[#0051d5] border-[#0051d5]/20" : "bg-[#e7eeff] text-[#74777f]"}>
                    {u.rol === "admin" && <Shield className="mr-1 h-3 w-3" />}
                    {u.rol.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-[#64748b] font-mono">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <UsuarioModal
                    usuario={{ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }}
                    trigger={
                      <Button variant="outline" size="sm" className="border-[#c4c6cf] text-[#74777f]">
                        Editar
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
