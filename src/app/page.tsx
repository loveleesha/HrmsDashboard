import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/services/auth.service";

export default async function RootPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(SESSION_COOKIE)?.value);

  redirect(hasSession ? "/dashboard" : "/login");
}
