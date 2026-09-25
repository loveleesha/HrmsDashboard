"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Drawer } from "@/components/molecules/Drawer";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Avatar } from "@/components/atoms/Avatar";
import { useToast } from "@/hooks/use-toast";
import { updateAdminProfile } from "@/services/profile.service";
import type { MyProfile } from "@/types/profile";

export interface EditAdminProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: MyProfile;
  onSaved: (profile: MyProfile) => void;
}

/** Admin-tier accounts only — PATCH /api/admin/profile, one request for
 * name, mobile, and picture together (that endpoint's `file` field). Just
 * these three: an admin account has no address/skills/emergency contacts to
 * edit. */
export function EditAdminProfileDrawer({ open, onClose, profile, onSaved }: EditAdminProfileDrawerProps) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [mobile, setMobile] = useState(profile.phone ?? "");
  const [file, setFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed from the latest profile every time the drawer opens — adjusted
  // during render, not an effect, so it happens before paint.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(profile.name);
      setMobile(profile.phone ?? "");
      setFile(undefined);
      setPreviewUrl(undefined);
    }
  }

  function handleFile(selected: File | undefined) {
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const updated = await updateAdminProfile({ name: name.trim(), mobile: mobile.trim(), file });
      onSaved(updated);
      showToast("Profile updated.");
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update your profile.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit Profile"
      widthClassName="sm:max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={name || profile.name} imageUrl={previewUrl ?? profile.avatarUrl} size="lg" className="size-16 text-fs-2xl" />
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="size-3.5" />
              Change Photo
            </Button>
          </div>
        </div>
        <FormField label="Full Name" htmlFor="edit-admin-name" required>
          <Input id="edit-admin-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Mobile" htmlFor="edit-admin-mobile">
          <Input id="edit-admin-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </FormField>
      </div>
    </Drawer>
  );
}
