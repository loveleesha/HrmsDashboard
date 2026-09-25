"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Tabs } from "@/components/molecules/Tabs";
import { RecognitionSummaryCards } from "@/components/organisms/recognition/RecognitionSummaryCards";
import { RecognitionFeed } from "@/components/organisms/recognition/RecognitionFeed";
import { RecognitionForm, type RecognitionFormValues } from "@/components/organisms/recognition/RecognitionForm";
import { RecognitionLeaderboard } from "@/components/organisms/recognition/RecognitionLeaderboard";
import { useAuth } from "@/hooks/use-auth";
import { useRBAC } from "@/hooks/use-rbac";
import { useToast } from "@/hooks/use-toast";
import { getEmployees } from "@/services/employee.service";
import { getRecognitions, buildSummary, buildLeaderboard } from "@/services/recognition.service";
import type { Employee } from "@/types/employee";
import type { Recognition } from "@/types/recognition";

const TAB_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Received", value: "received" },
  { label: "Given", value: "given" },
];

let localId = 1000;

export default function RecognitionPage() {
  const { user } = useAuth();
  const { can } = useRBAC();
  const { showToast } = useToast();
  const canGive = can("peerRecognition", "add");

  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [recognitions, setRecognitions] = useState<Recognition[] | null>(null);
  const [tab, setTab] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getEmployees(), getRecognitions()]).then(([employeeData, recognitionData]) => {
      if (!isMounted) return;
      setEmployees(employeeData);
      setRecognitions(recognitionData);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentEmployee =
    employees?.find((employee) => employee.email === user?.email) ?? employees?.[0] ?? null;

  const summary = useMemo(
    () => buildSummary(recognitions ?? [], currentEmployee?.id),
    [recognitions, currentEmployee]
  );

  const leaderboard = useMemo(() => buildLeaderboard(recognitions ?? []), [recognitions]);

  const filteredRecognitions = useMemo(() => {
    if (!recognitions || !currentEmployee) return recognitions ?? [];
    if (tab === "received") return recognitions.filter((r) => r.toId === currentEmployee.id);
    if (tab === "given") return recognitions.filter((r) => r.fromId === currentEmployee.id);
    return recognitions;
  }, [recognitions, tab, currentEmployee]);

  function handleToggleLike(id: string) {
    setRecognitions((prev) =>
      (prev ?? []).map((recognition) =>
        recognition.id === id
          ? {
              ...recognition,
              likedByMe: !recognition.likedByMe,
              likes: recognition.likedByMe ? recognition.likes - 1 : recognition.likes + 1,
            }
          : recognition
      )
    );
  }

  function handleSubmit(values: RecognitionFormValues) {
    if (!employees || !currentEmployee) return;
    const target = employees.find((employee) => employee.id === values.employeeId);
    if (!target) return;

    const newRecognition: Recognition = {
      id: `rec-local-${++localId}`,
      fromId: currentEmployee.id,
      fromName: currentEmployee.name,
      toId: target.id,
      toName: target.name,
      badge: values.badge,
      message: values.message,
      likes: 0,
      createdAt: new Date().toISOString(),
      timestamp: "Just now",
    };

    setRecognitions((prev) => [newRecognition, ...(prev ?? [])]);
    setFormOpen(false);
    showToast(`Recognition sent to ${target.name}.`);
  }

  return (
    <div>
      <PageHeader
        title="Peer Recognition"
        description="Celebrate your colleagues and recognize great work."
        actions={
          canGive ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Give Recognition
            </Button>
          ) : undefined
        }
      />

      {!employees || !recognitions ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading recognitions…
        </div>
      ) : (
        <>
          <RecognitionSummaryCards summary={summary} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
            <div>
              <div className="mb-4">
                <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} />
              </div>
              <RecognitionFeed recognitions={filteredRecognitions} onToggleLike={handleToggleLike} />
            </div>

            <div className="flex flex-col gap-4">
              <RecognitionLeaderboard entries={leaderboard} />
            </div>
          </div>

          <RecognitionForm
            open={formOpen}
            onClose={() => setFormOpen(false)}
            employees={employees}
            excludeEmployeeId={currentEmployee?.id}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
}
