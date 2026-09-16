"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_STYLES = {
  sm: "size-8 text-fs-sm",
  md: "size-10 text-fs-lg",
  lg: "size-14 text-fs-3xl",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("");
}

export function Avatar({ name, imageUrl, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const [trackedUrl, setTrackedUrl] = useState(imageUrl);

  // A new imageUrl deserves a fresh attempt — otherwise switching from one
  // broken image to a different, valid one would stay stuck on the fallback.
  if (imageUrl !== trackedUrl) {
    setTrackedUrl(imageUrl);
    setFailed(false);
  }

  if (imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar sources are arbitrary external URLs, not optimizable by next/image without domain config
      <img
        src={imageUrl}
        alt={name}
        onError={() => setFailed(true)}
        className={cn("rounded-full object-cover", SIZE_STYLES[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-avatar-bg font-semibold text-primary",
        SIZE_STYLES[size],
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
