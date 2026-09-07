"use client";

import { useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@/types/employee";

export function ProfilePictureTab({ employee }: { employee: Employee }) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-border bg-surface-card p-6">
      <h3 className="mb-4 text-fs-xl font-semibold text-ink">Profile Picture</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar name={employee.name} size="lg" className="size-24 text-fs-6xl" />
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-fs-base text-muted">
            Upload a clear, front-facing photo. JPG or PNG, up to 5 MB. Square images work best.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={() => showToast("Photo uploaded. It will appear once verified by HR.")}
            />
            <Button onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" />
              Upload New Photo
            </Button>
            <Button variant="secondary" onClick={() => showToast("Profile photo removed.", "info")}>
              <Trash2 className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
