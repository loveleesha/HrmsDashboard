"use client";

import { useState } from "react";
import { Drawer } from "@/components/molecules/Drawer";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/hooks/use-toast";
import { updateMyProfile } from "@/services/profile.service";
import { EmergencyContactsStep } from "@/components/organisms/onboarding/steps/EmergencyContactsStep";
import type { EmergencyContactDraft } from "@/types/onboarding";
import type { MyProfile } from "@/types/profile";

export interface EditBasicInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: MyProfile;
  onSaved: (profile: MyProfile) => void;
}

/** User > Profile > Update My Profile, type: "basic_detail" — name, contact,
 * skills, and a full-array-replace of emergency contacts. profileImage is
 * set separately via the Profile Picture tab. */
export function EditBasicInfoDrawer({ open, onClose, profile, onSaved }: EditBasicInfoDrawerProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [alternateMobile, setAlternateMobile] = useState(profile.alternateMobile ?? "");
  const [addressLine, setAddressLine] = useState(profile.address?.addressLine ?? "");
  const [city, setCity] = useState(profile.address?.city ?? "");
  const [state, setState] = useState(profile.address?.state ?? "");
  const [pincode, setPincode] = useState(profile.address?.pincode ?? "");
  const [skillsInput, setSkillsInput] = useState(profile.skills.join(", "));
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactDraft[]>(profile.emergencyContacts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed from the latest profile every time the drawer opens — adjusted
  // during render, not an effect, so it happens before paint.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(profile.name);
      setPhone(profile.phone ?? "");
      setAlternateMobile(profile.alternateMobile ?? "");
      setAddressLine(profile.address?.addressLine ?? "");
      setCity(profile.address?.city ?? "");
      setState(profile.address?.state ?? "");
      setPincode(profile.address?.pincode ?? "");
      setSkillsInput(profile.skills.join(", "));
      setEmergencyContacts(profile.emergencyContacts);
    }
  }

  async function handleSave() {
    if (emergencyContacts.length > 0 && !emergencyContacts.some((c) => c.isPrimary)) {
      showToast("Exactly one emergency contact must be marked Primary.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateMyProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        alternateMobile: alternateMobile.trim() || undefined,
        address: { addressLine: addressLine.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim() },
        skills: skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        emergencyContacts: emergencyContacts.map((c) => ({
          name: c.name,
          relationship: c.relationship,
          mobile: c.mobile,
          email: c.email || undefined,
          isPrimary: c.isPrimary,
        })),
      });
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
      widthClassName="sm:max-w-xl"
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
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="edit-name" required>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Phone" htmlFor="edit-phone">
            <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label="Alternate Mobile" htmlFor="edit-alt-phone">
            <Input id="edit-alt-phone" value={alternateMobile} onChange={(e) => setAlternateMobile(e.target.value)} />
          </FormField>
          <FormField label="Skills" htmlFor="edit-skills">
            <Input id="edit-skills" placeholder="Comma-separated, e.g. React, Node.js" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
          </FormField>
        </div>

        <div>
          <h3 className="mb-3 text-fs-lg font-semibold text-ink">Address</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Address Line" htmlFor="edit-address-line" className="sm:col-span-2">
              <Input id="edit-address-line" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
            </FormField>
            <FormField label="City" htmlFor="edit-city">
              <Input id="edit-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </FormField>
            <FormField label="State" htmlFor="edit-state">
              <Input id="edit-state" value={state} onChange={(e) => setState(e.target.value)} />
            </FormField>
            <FormField label="Pincode" htmlFor="edit-pincode">
              <Input id="edit-pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <EmergencyContactsStep value={emergencyContacts} onChange={setEmergencyContacts} />
        </div>
      </div>
    </Drawer>
  );
}
