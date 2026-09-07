import type { DashboardData } from "@/types/dashboard";

/**
 * Mock dashboard data service. Replace the body of getDashboardData with a
 * real API call once the Node.js backend exists — callers only depend on
 * this function's signature (Promise<DashboardData>).
 */

const MOCK_DASHBOARD_DATA: DashboardData = {
  stats: [
    { label: "Total Employees", value: "248", delta: "+6 this month", trend: "up" },
    { label: "Present Today", value: "221", delta: "89% attendance", trend: "up" },
    { label: "On Leave", value: "14", delta: "5.6% of workforce", trend: "flat" },
    { label: "New Employees", value: "6", delta: "Joined this month", trend: "up" },
    { label: "Pending Approvals", value: "9", delta: "3 overdue", trend: "down" },
    { label: "Open Positions", value: "12", delta: "Across 5 teams", trend: "flat" },
    { label: "Payroll Summary", value: "₹1.86 Cr", delta: "Processed for Aug", trend: "up" },
  ],
  employeeGrowth: [
    { month: "Mar", value: 214 },
    { month: "Apr", value: 221 },
    { month: "May", value: 227 },
    { month: "Jun", value: 233 },
    { month: "Jul", value: 242 },
    { month: "Aug", value: 248 },
  ],
  attendanceTrend: [
    { day: "Mon", present: 228, remote: 12, absent: 8 },
    { day: "Tue", present: 231, remote: 10, absent: 7 },
    { day: "Wed", present: 219, remote: 18, absent: 11 },
    { day: "Thu", present: 224, remote: 14, absent: 10 },
    { day: "Fri", present: 221, remote: 16, absent: 11 },
    { day: "Sat", present: 96, remote: 22, absent: 4 },
  ],
  leaveTrend: [
    { month: "Mar", value: 31 },
    { month: "Apr", value: 26 },
    { month: "May", value: 38 },
    { month: "Jun", value: 22 },
    { month: "Jul", value: 29 },
    { month: "Aug", value: 34 },
  ],
  departmentDistribution: [
    { department: "Engineering", count: 96 },
    { department: "Sales", count: 42 },
    { department: "HR", count: 18 },
    { department: "Finance", count: 22 },
    { department: "Marketing", count: 28 },
    { department: "Operations", count: 42 },
  ],
  todayAttendance: [
    { name: "Aarav Sharma", designation: "Senior Software Engineer", status: "Present", checkIn: "09:52 AM" },
    { name: "Diya Patel", designation: "Product Designer", status: "Remote", checkIn: "09:41 AM" },
    { name: "Karan Malhotra", designation: "Engineering Manager", status: "Present", checkIn: "09:15 AM" },
    { name: "Meera Nair", designation: "QA Engineer", status: "Late", checkIn: "10:32 AM" },
    { name: "Rohan Desai", designation: "Payroll Manager", status: "On Leave", checkIn: "--" },
  ],
  upcomingBirthdays: [
    { name: "Simran Kaur", designation: "Talent Acquisition Specialist", date: "Sep 09" },
    { name: "Aditya Rao", designation: "Backend Engineer", date: "Sep 12" },
    { name: "Priya Menon", designation: "Marketing Lead", date: "Sep 18" },
  ],
  newJoinees: [
    { name: "Ishaan Gupta", designation: "Frontend Engineer", department: "Engineering", joinedOn: "Sep 01, 2026" },
    { name: "Devika Pillai", designation: "Finance Intern", department: "Finance", joinedOn: "Jul 01, 2026" },
    { name: "Yash Choudhary", designation: "SDE Intern", department: "Engineering", joinedOn: "Jun 01, 2026" },
  ],
  upcomingEvents: [
    { title: "Q3 Town Hall", date: "Sep 12, 2026", time: "04:00 PM", location: "Main Auditorium", type: "Town Hall", attendees: 248 },
    { title: "React Performance Workshop", date: "Sep 16, 2026", time: "11:00 AM", location: "Training Room B / Online", type: "Workshop", attendees: 42 },
    { title: "Ganesh Chaturthi Celebration", date: "Sep 14, 2026", time: "01:00 PM", location: "Cafeteria", type: "Celebration", attendees: 120 },
    { title: "New Hire Buddy Mixer", date: "Sep 19, 2026", time: "05:30 PM", location: "Terrace Lounge", type: "Social", attendees: 30 },
  ],
  upcomingHolidays: [
    { name: "Ganesh Chaturthi", date: "Sep 14, 2026", day: "Monday" },
    { name: "Gandhi Jayanti", date: "Oct 02, 2026", day: "Friday" },
    { name: "Diwali", date: "Nov 08, 2026", day: "Sunday" },
  ],
  pendingLeaveRequests: [
    { name: "Meera Nair", leaveType: "Sick Leave", dates: "Sep 09 – Sep 10", days: 2 },
    { name: "Aditya Rao", leaveType: "Casual Leave", dates: "Sep 15", days: 1 },
    { name: "Diya Patel", leaveType: "Earned Leave", dates: "Sep 22 – Sep 26", days: 5 },
  ],
  recentActivity: [
    { actor: "Ananya Iyer", action: "approved Meera Nair's leave request", timestamp: "10 min ago" },
    { actor: "System", action: "processed payroll for August", timestamp: "1 hour ago" },
    { actor: "Simran Kaur", action: "moved Rahul Verma to Interview stage", timestamp: "3 hours ago" },
    { actor: "Karan Malhotra", action: "submitted Q3 performance reviews", timestamp: "Yesterday" },
  ],
  announcements: [
    {
      title: "Q3 town hall — Sep 12",
      body: "Join the all-hands town hall to hear Q3 results and the Q4 roadmap.",
      postedBy: "Vikram Mehta",
      date: "Sep 05, 2026",
      priority: "High",
    },
    {
      title: "New health insurance partner",
      body: "HR has onboarded a new health insurance provider effective October 1st.",
      postedBy: "Ananya Iyer",
      date: "Sep 02, 2026",
      priority: "Normal",
    },
  ],
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDashboardData(): Promise<DashboardData> {
  await delay(300);
  return MOCK_DASHBOARD_DATA;
}
