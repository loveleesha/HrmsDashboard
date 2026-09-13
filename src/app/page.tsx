import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, isJwtShaped } from "@/services/auth.service";

export default async function RootPage() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  const hasSession = Boolean(cookieValue && isJwtShaped(cookieValue));

  redirect(hasSession ? "/dashboard" : "/login");
}
