"use server"

import { auth } from "@/lib/auth"

export async function syncWinfac() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return { error: "No autorizado" }
  }

  const syncKey = process.env.SYNC_KEY
  if (!syncKey) return { error: "SYNC_KEY no configurada" }

  const res = await fetch(`${process.env.NEXTAUTH_URL ?? 'https://app-arjun.vercel.app'}/api/sync/winfac`, {
    headers: { 'x-sync-key': syncKey }
  })

  const data = await res.json()
  if (!res.ok) return { error: data.error ?? 'Error en sync' }
  return { success: true, ...data }
}
