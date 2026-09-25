"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/hooks/use-toast";
import { toAbsoluteAssetUrl } from "@/lib/asset-url";
import { updateAdminProfile, uploadMyProfilePicture } from "@/services/profile.service";
import type { MyProfile } from "@/types/profile";

/** User > Profile > Upload My Profile Picture — multipart/form-data, field
 * "file" (jpeg/png/webp). Replaces any existing picture; there's no separate
 * remove-picture endpoint, so only "Upload New Photo" is offered here.
 * Admin-tier accounts (profileType: "admin") have no Employee record, so
 * that endpoint doesn't apply — they go through PATCH /api/admin/profile's
 * own `file` field instead (confirmed via Postman). */
export interface ProfilePictureTabProps {
  employee: MyProfile;
  onUploaded?: (avatarUrl: string) => void;
}

export function ProfilePictureTab({ employee, onUploaded }: ProfilePictureTabProps) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(employee.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    try {
      let absoluteUrl: string | undefined;
      if (employee.profileType === "admin") {
        const updated = await updateAdminProfile({ file });
        absoluteUrl = updated.avatarUrl;
      } else {
        const url = await uploadMyProfilePicture(file);
        absoluteUrl = toAbsoluteAssetUrl(url);
      }
      if (absoluteUrl) {
        setAvatarUrl(absoluteUrl);
        onUploaded?.(absoluteUrl);
      }
      showToast("Profile photo updated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not upload this photo.", "error");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface-card p-6">
      <h3 className="mb-4 text-fs-xl font-semibold text-ink">Profile Picture</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar name={employee.name} imageUrl={avatarUrl} size="lg" className="size-24 text-fs-6xl" />
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-fs-base text-muted">
            Upload a clear, front-facing photo. JPG, PNG, or WEBP. Square images work best.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button onClick={() => inputRef.current?.click()} isLoading={isUploading}>
              <Upload className="size-4" />
              Upload New Photo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
