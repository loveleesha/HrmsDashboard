import type { LucideIcon, LucideProps } from "lucide-react";

export interface IconProps extends LucideProps {
  icon: LucideIcon;
}

export function Icon({ icon: LucideComponent, ...props }: IconProps) {
  return <LucideComponent {...props} />;
}
