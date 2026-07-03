import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  hidden?: boolean;
}

export interface ActionSeparator {
  type: "separator";
}

export type ActionEntry = ActionItem | ActionSeparator;

export function DropdownAction({
  items,
  disabled = false,
}: {
  items: ActionEntry[];
  disabled?: boolean;
}) {
  const visible = items.filter((item) => {
    if ("type" in item) return true;
    return !(item as ActionItem).hidden;
  });

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled} aria-label="Acciones">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[160px] animate-fade-in rounded-lg border bg-card p-1 text-card-foreground shadow-lg"
        >
          {visible.map((item, i) => {
            if ("type" in item) {
              return <DropdownMenu.Separator key={i} className="my-1 h-px bg-border" />;
            }
            const a = item as ActionItem;
            const Icon = a.icon;
            return (
              <DropdownMenu.Item
                key={i}
                disabled={a.disabled}
                onSelect={a.onClick}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors",
                  a.variant === "destructive"
                    ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                    : "hover:bg-accent focus:bg-accent",
                  a.disabled && "pointer-events-none opacity-50",
                )}
              >
                {Icon && <Icon className="size-3.5" />}
                {a.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
