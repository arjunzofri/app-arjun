import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const isMobile = /android|iphone|ipad|mobile/i.test(ua);
  if (isMobile) redirect("/salidas");
  redirect("/bodegas");
}
