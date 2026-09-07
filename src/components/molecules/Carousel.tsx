"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CarouselProps {
  slides: ReactNode[];
  className?: string;
}

export function Carousel({ slides, className }: CarouselProps) {
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  function go(delta: number) {
    setIndex((prev) => (prev + delta + slides.length) % slides.length);
  }

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="w-full shrink-0">
              {slide}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-border-strong"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface-card text-muted shadow-sm hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface-card text-muted shadow-sm hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
