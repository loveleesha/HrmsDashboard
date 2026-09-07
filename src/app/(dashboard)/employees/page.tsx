import { PageHeader } from "@/components/molecules/PageHeader";
import { EmployeeDirectory } from "@/components/organisms/employees/EmployeeDirectory";

export default function EmployeesPage() {
  return (
    <div>
      <PageHeader
        title="Employee Directory"
        description="Find and connect with people across your organization."
      />
      <EmployeeDirectory />
    </div>
  );
}
