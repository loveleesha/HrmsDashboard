import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  if (rating <= 0) {
    return <span className={cn("text-fs-sm text-muted-light", className)}>Not yet rated</span>;
  }

  return (
    <span className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn("size-3.5", index < rating ? "fill-warning text-warning" : "text-border-strong")}
        />
      ))}
    </span>
  );
}
