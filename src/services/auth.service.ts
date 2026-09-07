import type { User } from "@/types/user";

/**
 * Mock auth service. Swap the bodies of login/logout/getSessionUser for real
 * API calls when the Node.js backend exists — callers only depend on this
 * module's exported signatures, not on how the session is stored.
 */

export const SESSION_COOKIE = "hrms_session";

export const MOCK_USERS: User[] = [
  {
    id: "u-1000",
    employeeId: "EMP-1000",
    name: "Vikram Mehta",
    email: "vikram.mehta@hikeassociate.com",
    role: "super_admin",
    designation: "Chief Executive Officer",
    department: "Leadership",
  },
  {
    id: "u-1021",
    employeeId: "EMP-1021",
    name: "Ananya Iyer",
    email: "ananya.iyer@hikeassociate.com",
    role: "hr_admin",
    designation: "HR Manager",
    department: "Human Resources",
  },
  {
    id: "u-1042",
    employeeId: "EMP-1042",
    name: "Riya Kapoor",
    email: "riya.kapoor@hikeassociate.com",
    role: "hr_executive",
    designation: "HR Executive",
    department: "Human Resources",
  },
  {
    id: "u-1015",
    employeeId: "EMP-1015",
    name: "Karan Malhotra",
    email: "karan.malhotra@hikeassociate.com",
    role: "manager",
    designation: "Engineering Manager",
    department: "Engineering",
  },
  {
    id: "u-1101",
    employeeId: "EMP-1101",
    name: "Aarav Sharma",
    email: "aarav.sharma@hikeassociate.com",
    role: "employee",
    designation: "Senior Software Engineer",
    department: "Engineering",
  },
  {
    id: "u-1033",
    employeeId: "EMP-1033",
    name: "Simran Kaur",
    email: "simran.kaur@hikeassociate.com",
    role: "recruiter",
    designation: "Talent Acquisition Specialist",
    department: "Recruitment",
  },
  {
    id: "u-1027",
    employeeId: "EMP-1027",
    name: "Rohan Desai",
    email: "rohan.desai@hikeassociate.com",
    role: "payroll_admin",
    designation: "Payroll Manager",
    department: "Finance",
  },
  {
    id: "u-1301",
    employeeId: "EMP-1301",
    name: "Tanvi Shah",
    email: "tanvi.shah@hikeassociate.com",
    role: "special_employee",
    designation: "DevOps Engineer",
    department: "Engineering",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setSessionCookie(email: string) {
  const maxAgeSeconds = 60 * 60 * 24 * 7;
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(email)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export async function login(email: string, password: string): Promise<User> {
  await delay(500);

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const user = MOCK_USERS.find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    throw new Error("No account found for that email address.");
  }

  setSessionCookie(user.email);
  return user;
}

export function logout() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export function getSessionUser(): User | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`)
  );

  if (!match) return null;

  const email = decodeURIComponent(match[1]);
  return (
    MOCK_USERS.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase()
    ) ?? null
  );
}
