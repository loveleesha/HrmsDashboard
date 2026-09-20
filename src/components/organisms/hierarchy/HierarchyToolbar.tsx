import { ZoomIn, ZoomOut, Maximize, RotateCcw, ChevronsDown, ChevronsUp } from "lucide-react";
import { Button } from "@/components/atoms/Button";

export interface HierarchyToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function HierarchyToolbar({ onZoomIn, onZoomOut, onFit, onReset, onExpandAll, onCollapseAll }: HierarchyToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface-card p-1.5">
      <Button variant="ghost" size="sm" onClick={onZoomIn} aria-label="Zoom in">
        <ZoomIn className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onZoomOut} aria-label="Zoom out">
        <ZoomOut className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onFit}>
        <Maximize className="size-4" />
        Fit
      </Button>
      <Button variant="ghost" size="sm" onClick={onReset}>
        <RotateCcw className="size-4" />
        Reset
      </Button>
      <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <Button variant="ghost" size="sm" onClick={onExpandAll}>
        <ChevronsDown className="size-4" />
        Expand All
      </Button>
      <Button variant="ghost" size="sm" onClick={onCollapseAll}>
        <ChevronsUp className="size-4" />
        Collapse All
      </Button>
    </div>
  );
}
