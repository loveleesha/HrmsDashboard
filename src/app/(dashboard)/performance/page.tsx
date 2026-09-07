"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Target, CheckCircle2, AlertTriangle, Star } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Tabs } from "@/components/molecules/Tabs";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { GoalsList } from "@/components/organisms/performance/GoalsList";
import { AddGoalForm, type AddGoalValues } from "@/components/organisms/performance/AddGoalForm";
import { TeamPerformanceTable } from "@/components/organisms/performance/TeamPerformanceTable";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getEmployees } from "@/services/employee.service";
import { getMyGoals, getTeamPerformance, newGoalId } from "@/services/performance.service";
import type { Goal } from "@/types/performance";
import type { TeamPerformanceRow } from "@/types/performance";
import type { Employee } from "@/types/employee";

const TAB_OPTIONS = [
  { label: "My Goals", value: "goals" },
  { label: "Team Performance", value: "team" },
];

export default function PerformancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [teamRows, setTeamRows] = useState<TeamPerformanceRow[] | null>(null);
  const [tab, setTab] = useState("goals");
  const [formOpen, setFormOpen] = useState(false);

  const canAdd = can("performance", "add");
  const canViewTeam = can("performance", "approve");

  useEffect(() => {
    let isMounted = true;
    getEmployees().then((data) => {
      if (!isMounted) return;
      setEmployees(data);
      const me = data.find((e) => e.email === user?.email) ?? data[0];
      if (me) getMyGoals(me.id).then((g) => isMounted && setGoals(g));
    });
    if (canViewTeam) {
      getTeamPerformance().then((data) => isMounted && setTeamRows(data));
    }
    return () => {
      isMounted = false;
    };
  }, [user, canViewTeam]);

  const currentEmployee = employees?.find((e) => e.email === user?.email) ?? employees?.[0] ?? null;

  const summary = useMemo(() => {
    const list = goals ?? [];
    return {
      onTrack: list.filter((g) => g.status === "On Track").length,
      completed: list.filter((g) => g.status === "Completed").length,
      atRisk: list.filter((g) => g.status === "At Risk").length,
      avgProgress: list.length ? Math.round(list.reduce((sum, g) => sum + g.progress, 0) / list.length) : 0,
    };
  }, [goals]);

  function handleAddGoal(values: AddGoalValues) {
    if (!currentEmployee) return;
    const newGoal: Goal = {
      id: newGoalId(),
      employeeId: currentEmployee.id,
      title: values.title,
      description: values.description,
      progress: 0,
      status: "Not Started",
      dueDate: values.dueDate,
    };
    setGoals((prev) => [newGoal, ...(prev ?? [])]);
    setFormOpen(false);
    showToast("Goal added.");
  }

  const tabOptions = canViewTeam ? TAB_OPTIONS : TAB_OPTIONS.slice(0, 1);
  const activeTab = tabOptions.some((option) => option.value === tab) ? tab : tabOptions[0].value;

  return (
    <div>
      <PageHeader
        title="Performance"
        description="Goals, reviews, and feedback"
        actions={
          activeTab === "goals" && canAdd ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Add Goal
            </Button>
          ) : undefined
        }
      />

      {!goals || !currentEmployee ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading performance data…
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Avg Goal Progress" value={`${summary.avgProgress}%`} icon={Target} />
            <StatCard label="Completed" value={String(summary.completed)} icon={CheckCircle2} />
            <StatCard label="On Track" value={String(summary.onTrack)} icon={Star} />
            <StatCard label="At Risk" value={String(summary.atRisk)} icon={AlertTriangle} />
          </div>

          {tabOptions.length > 1 && (
            <div className="mb-4">
              <Tabs options={tabOptions} value={activeTab} onChange={setTab} />
            </div>
          )}

          {activeTab === "goals" && <GoalsList goals={goals} />}

          {activeTab === "team" && canViewTeam && (
            <>
              {!teamRows ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted">
                  <Spinner />
                  Loading team performance…
                </div>
              ) : (
                <TeamPerformanceTable rows={teamRows} />
              )}
            </>
          )}

          <AddGoalForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAddGoal} />
        </>
      )}
    </div>
  );
}
