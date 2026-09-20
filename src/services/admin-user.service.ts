import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";

/**
 * Admin > Admin Users — the lightweight manual employee-creation path from
 * the "HRMS API" collection, as an alternative to the full onboarding
 * wizard. Create the account, then assign a role once its roleId is known
 * (see role.service.ts's listRoles for resolving a role name to its id).
 */

export type AdminUserType = "admin" | "hr" | "employee";

interface CreateAdminUserResponse {
  user: { id?: string; _id?: string };
  message?: string;
}

export async function createAdminUser(params: {
  name: string;
  email: string;
  password: string;
  userType: AdminUserType;
}): Promise<{ userId: string; message: string }> {
  const data = await httpService.post<CreateAdminUserResponse>(API_ENDPOINTS.admin.users, params);
  const userId = data.user.id ?? data.user._id;
  if (!userId) throw new Error("Server did not return a user id.");
  return { userId, message: data.message ?? "User created." };
}

export async function assignAdminUserRole(userId: string, roleId: string): Promise<{ message: string }> {
  const data = await httpService.patch<{ message?: string }>(API_ENDPOINTS.admin.userRole(userId), { roleId });
  return { message: data?.message ?? "Role assigned." };
}
