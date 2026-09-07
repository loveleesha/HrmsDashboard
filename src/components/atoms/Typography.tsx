import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "small"
  | "muted";

const VARIANT_STYLES: Record<TypographyVariant, string> = {
  h1: "text-fs-7xl font-bold text-ink",
  h2: "text-fs-6xl font-semibold text-ink",
  h3: "text-fs-4xl font-semibold text-ink",
  h4: "text-fs-2xl font-semibold text-ink",
  body: "text-fs-lg text-ink",
  small: "text-fs-base text-muted",
  muted: "text-fs-base text-muted",
};

const DEFAULT_ELEMENT: Record<TypographyVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body: "p",
  small: "p",
  muted: "p",
};

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: ElementType;
  children: ReactNode;
}

export function Typography({
  variant = "body",
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  const Component = as ?? DEFAULT_ELEMENT[variant];

  return (
    <Component className={cn(VARIANT_STYLES[variant], className)} {...props}>
      {children}
    </Component>
  );
}
