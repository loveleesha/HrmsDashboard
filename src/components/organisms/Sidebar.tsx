"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NAV_SECTIONS } from "@/lib/nav-items";
import { useSidebar } from "@/hooks/use-sidebar";
import { useRBAC } from "@/hooks/use-rbac";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/types/nav";
import type { Role } from "@/types/user";
import type { ModuleKey } from "@/types/rbac";

const ALL_NAV_HREFS: string[] = NAV_SECTIONS.flatMap((section) =>
  section.items.flatMap((item) => [item.href, ...(item.children?.map((child) => child.href) ?? [])])
);

/**
 * A child href can be a prefix of a sibling's (e.g. Employees' "/employees"
 * vs its own child "/employees/onboarding"), so naive prefix matching marks
 * both active at once. Resolve it the way routers do: whichever known href
 * matches the current path most specifically (longest) wins, and every
 * other item — even ones that also technically prefix-match — is inactive.
 */
function findActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const href of ALL_NAV_HREFS) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      if (!best || href.length > best.length) best = href;
    }
  }
  return best;
}

function SidebarLink({
  item,
  collapsed,
  active,
  label,
  onNavigate,
  indent,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  label: string;
  onNavigate: () => void;
  indent?: boolean;
}) {
  const ItemIcon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-fs-lg transition-colors",
        indent && "py-1.5 text-fs-base",
        active
          ? "bg-primary-soft text-primary font-medium"
          : "text-muted hover:bg-surface hover:text-ink"
      )}
    >
      <ItemIcon className={cn("shrink-0", indent ? "size-4" : "size-[18px]")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarItem({
  item,
  collapsed,
  activeHref,
  viewAsRole,
  can,
  onNavigate,
  openGroups,
  toggleGroup,
}: {
  item: NavItem;
  collapsed: boolean;
  activeHref: string | null;
  viewAsRole: Role;
  can: (module: ModuleKey, action?: "view") => boolean;
  onNavigate: () => void;
  openGroups: Set<string>;
  toggleGroup: (href: string) => void;
}) {
  const label = item.roleLabels?.[viewAsRole] ?? item.label;
  const visibleChildren = item.children?.filter((child) => can(child.module, "view"));

  if (!visibleChildren || visibleChildren.length === 0) {
    return (
      <SidebarLink
        item={item}
        collapsed={collapsed}
        active={item.href === activeHref}
        label={label}
        onNavigate={onNavigate}
      />
    );
  }

  if (visibleChildren.length === 1) {
    // A single accessible child isn't worth a toggle — link to it directly.
    return (
      <SidebarLink
        item={{ ...item, href: visibleChildren[0].href, icon: visibleChildren[0].icon }}
        collapsed={collapsed}
        active={visibleChildren[0].href === activeHref}
        label={visibleChildren[0].roleLabels?.[viewAsRole] ?? label}
        onNavigate={onNavigate}
      />
    );
  }

  if (collapsed) {
    // No room for a chevron/sub-list in icon-rail mode — link straight to the first child.
    return (
      <SidebarLink
        item={{ ...item, href: visibleChildren[0].href }}
        collapsed
        active={visibleChildren.some((child) => child.href === activeHref)}
        label={label}
        onNavigate={onNavigate}
      />
    );
  }

  const anyChildActive = visibleChildren.some((child) => child.href === activeHref);
  const isOpen = openGroups.has(item.href) || anyChildActive;

  return (
    <div>
      <button
        type="button"
        onClick={() => toggleGroup(item.href)}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-fs-lg transition-colors",
          anyChildActive ? "text-ink font-medium" : "text-muted hover:bg-surface hover:text-ink"
        )}
      >
        <item.icon className="size-[18px] shrink-0" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-3 pt-0.5">
          {visibleChildren.map((child) => (
            <SidebarLink
              key={child.href}
              item={child}
              collapsed={collapsed}
              active={child.href === activeHref}
              label={child.roleLabels?.[viewAsRole] ?? child.label}
              onNavigate={onNavigate}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useSidebar();
  const { can, viewAsRole } = useRBAC();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  function toggleGroup(href: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.children ? item.children.some((child) => can(child.module, "view")) : can(item.module, "view")
    ),
  })).filter((section) => section.items.length > 0);

  const activeHref = findActiveHref(pathname);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/35 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-surface-card transition-all duration-200",
          "lg:relative lg:inset-auto lg:z-auto lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          mobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-fs-xl font-bold text-white">
              H
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="truncate text-fs-lg font-semibold text-ink">
                  Hike Associate
                </p>
                <p className="truncate text-fs-sm text-muted">
                  HR Management
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="text-muted-light hover:text-ink lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visibleSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!collapsed && (
                <p className="mb-1 px-3 text-fs-sm font-semibold uppercase tracking-wide text-muted-light">
                  {section.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    activeHref={activeHref}
                    viewAsRole={viewAsRole}
                    can={can}
                    onNavigate={closeMobile}
                    openGroups={openGroups}
                    toggleGroup={toggleGroup}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden shrink-0 items-center gap-2 border-t border-border px-4 py-3 text-fs-base text-muted hover:text-ink lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="size-[18px]" />
              Collapse
            </>
          )}
        </button>
      </aside>
    </>
  );
}
