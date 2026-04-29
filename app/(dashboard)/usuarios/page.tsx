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
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400">Control de acceso y roles para el personal de Arjun.</p>
        </div>
        <UsuarioModal
          trigger={
            <Button className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-600">
              <UserPlus className="mr-2 h-4 w-4" /> Invitar Usuario
            </Button>
          }
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              <TableHead className="font-mono text-xs uppercase">Nombre</TableHead>
              <TableHead className="font-mono text-xs uppercase">Email</TableHead>
              <TableHead className="font-mono text-xs uppercase">Rol</TableHead>
              <TableHead className="font-mono text-xs uppercase">Creado</TableHead>
              <TableHead className="text-right font-mono text-xs uppercase">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.map((u) => (
              <TableRow key={u.id} className="border-slate-800">
                <TableCell className="font-bold text-slate-200">{u.nombre}</TableCell>
                <TableCell className="text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {u.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={u.rol === "admin" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-slate-800 text-slate-400"}>
                    {u.rol === "admin" && <Shield className="mr-1 h-3 w-3" />}
                    {u.rol.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-mono">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <UsuarioModal
                    usuario={{ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }}
                    trigger={
                      <Button variant="outline" size="sm" className="border-slate-800 text-slate-400">
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
