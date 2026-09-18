"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { SearchInput } from "@/components/molecules/SearchInput";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { ProjectFormModal } from "@/components/organisms/projects/ProjectFormModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { createProject, deleteProject, listProjects, updateProject } from "@/services/project.service";
import type { ApiProject, CreateProjectPayload, UpdateProjectPayload } from "@/types/project";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function ProjectsPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const [projects, setProjects] = useState<ApiProject[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiProject | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ApiProject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    listProjects()
      .then((data) => {
        if (isMounted) setProjects(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load projects.");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (projects ?? []).filter(
      (p) =>
        (!status || p.status === status) &&
        (!query ||
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.lead?.toLowerCase().includes(query))
    );
  }, [projects, search, status]);

  async function handleCreate(payload: CreateProjectPayload) {
    setIsSubmitting(true);
    try {
      const created = await createProject(payload);
      setProjects((prev) => [...(prev ?? []), created].sort((a, b) => a.name.localeCompare(b.name)));
      showToast("Project added.");
      setFormOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add this project.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(id: string, payload: UpdateProjectPayload) {
    setIsSubmitting(true);
    try {
      const updated = await updateProject(id, payload);
      setProjects((prev) => (prev ?? []).map((p) => (p.id === id ? updated : p)));
      showToast("Project updated.");
      setFormOpen(false);
      setEditTarget(undefined);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this project.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects((prev) => (prev ?? []).filter((p) => p.id !== deleteTarget.id));
      showToast(`Deleted ${deleteTarget.name}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this project.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  const canEdit = can("projects", "edit");
  const canDelete = can("projects", "delete");
  const activeCount = (projects ?? []).filter((p) => p.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Projects"
        description="The company's project list."
        actions={
          can("projects", "add") ? (
            <Button
              onClick={() => {
                setEditTarget(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add Project
            </Button>
          ) : undefined
        }
      />

      {loadError ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">
          {loadError}
        </p>
      ) : !projects ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading projects…
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard label="Total Projects" value={String(projects.length)} icon={Briefcase} />
            <StatCard label="Active" value={String(activeCount)} icon={CheckCircle2} />
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row">
            <SearchInput
              placeholder="Search by name, description, or lead…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:flex-1"
            />
            <FilterDropdown label="All statuses" options={STATUS_OPTIONS} value={status} onChange={setStatus} className="sm:w-44" />
          </div>

          <Table
            columns={[
              { key: "name", header: "Project Name", render: (p: ApiProject) => <span className="font-medium text-ink">{p.name}</span> },
              { key: "description", header: "Description", render: (p: ApiProject) => p.description || "—" },
              { key: "lead", header: "Lead", render: (p: ApiProject) => p.lead || "—" },
              {
                key: "status",
                header: "Status",
                render: (p: ApiProject) => <StatusBadge status={p.status === "active" ? "Active" : "Inactive"} />,
              },
              ...(canEdit || canDelete
                ? [
                    {
                      key: "actions",
                      header: "",
                      headerClassName: "w-10",
                      className: "text-right",
                      render: (p: ApiProject) => (
                        <div className="flex justify-end">
                          <ActionMenu
                            ariaLabel={`Actions for ${p.name}`}
                            items={[
                              {
                                label: "Edit",
                                icon: Pencil,
                                onClick: () => {
                                  setEditTarget(p);
                                  setFormOpen(true);
                                },
                                hidden: !canEdit,
                              },
                              { label: "Delete", icon: Trash2, tone: "danger", onClick: () => setDeleteTarget(p), hidden: !canDelete },
                            ]}
                          />
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
            data={visible}
            keyField={(p) => p.id}
            emptyMessage={projects.length === 0 ? "No projects yet." : "No projects match your search."}
          />
        </>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(undefined);
        }}
        project={editTarget}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Project"
        description={deleteTarget?.name}
        body="This can't be undone."
        confirmLabel="Delete Project"
        isConfirming={isDeleting}
      />
    </div>
  );
}
