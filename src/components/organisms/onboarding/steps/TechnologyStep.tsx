"use client";

import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import { Badge } from "@/components/atoms/Badge";
import { technologySchema } from "@/schemas/onboarding.schema";
import type { TechnologyInfo } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";
import { cn } from "@/lib/cn";

const TECHNOLOGY_CATALOG = [
  "React",
  "Node.js",
  "Next.js",
  "Java",
  "Python",
  "AWS",
  "TypeScript",
  "Angular",
  "Vue.js",
  ".NET",
  "PHP",
  "Docker",
  "Kubernetes",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "GraphQL",
  "Azure",
  "Google Cloud",
  "Salesforce",
];

export interface TechnologyStepProps {
  value: TechnologyInfo;
  onChange: (value: TechnologyInfo) => void;
}

export const TechnologyStep = forwardRef<OnboardingStepHandle, TechnologyStepProps>(function TechnologyStep(
  { value, onChange },
  ref
) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    validate: () => {
      const result = technologySchema.safeParse(value);
      setError(result.success ? null : result.error.issues[0]?.message ?? "Select at least one technology");
      return result.success;
    },
  }));

  const suggestions = useMemo(() => {
    const selected = new Set(value.technologies.map((t) => t.toLowerCase()));
    const filtered = TECHNOLOGY_CATALOG.filter(
      (tech) => !selected.has(tech.toLowerCase()) && tech.toLowerCase().includes(query.trim().toLowerCase())
    );
    return filtered.slice(0, 8);
  }, [query, value.technologies]);

  function addTechnology(tech: string) {
    const trimmed = tech.trim();
    if (!trimmed) return;
    const alreadySelected = value.technologies.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (alreadySelected) {
      setQuery("");
      return;
    }
    onChange({ technologies: [...value.technologies, trimmed] });
    setQuery("");
    setError(null);
  }

  function removeTechnology(tech: string) {
    onChange({ technologies: value.technologies.filter((t) => t !== tech) });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-fs-3xl font-semibold text-ink">Technology & Skills</h2>
        <p className="mt-1 text-fs-base text-muted">Select every technology the candidate works with.</p>
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-light" />
          <Input
            placeholder="Search or add a technology (e.g. React, AWS)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTechnology(suggestions[0] ?? query);
              }
            }}
            className="pl-9"
            invalid={Boolean(error)}
          />
        </div>

        {open && query.trim() && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface-card shadow-lg">
            {suggestions.map((tech) => (
              <button
                key={tech}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTechnology(tech)}
                className="flex w-full items-center px-3 py-2 text-left text-fs-base text-ink hover:bg-surface"
              >
                {tech}
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTechnology(query)}
              className={cn(
                "flex w-full items-center gap-1.5 px-3 py-2 text-left text-fs-base text-primary hover:bg-primary-softer",
                suggestions.length > 0 && "border-t border-border"
              )}
            >
              <Plus className="size-3.5" />
              Add &ldquo;{query.trim()}&rdquo; as Other
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-fs-base font-medium text-ink">Popular technologies</p>
        <div className="flex flex-wrap gap-2">
          {TECHNOLOGY_CATALOG.slice(0, 10).map((tech) => {
            const selected = value.technologies.some((t) => t.toLowerCase() === tech.toLowerCase());
            return (
              <button
                key={tech}
                type="button"
                onClick={() => (selected ? removeTechnology(tech) : addTechnology(tech))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-fs-base transition-colors",
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted hover:border-border-strong hover:text-ink"
                )}
              >
                {tech}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-fs-base font-medium text-ink">
          Selected technologies {value.technologies.length > 0 && `(${value.technologies.length})`}
        </p>
        {value.technologies.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-fs-base text-muted-light">
            No technologies selected yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.technologies.map((tech) => (
              <Badge key={tech} tone="primary" className="gap-1.5 py-1.5 pl-3 pr-2 text-fs-base">
                {tech}
                <button
                  type="button"
                  onClick={() => removeTechnology(tech)}
                  aria-label={`Remove ${tech}`}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {error && <p className="mt-2 text-fs-sm text-danger">{error}</p>}
      </div>
    </div>
  );
});
