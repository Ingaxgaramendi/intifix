import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Menu, Moon, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { principal, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = (principal?.email || "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Abrir menú"
      >
        <Menu />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambiar tema">
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {initials}
              </span>
              <span className="hidden text-sm font-medium sm:inline">
                {principal?.email || "Administrador"}
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-56 animate-fade-in rounded-md border bg-card p-1 text-card-foreground shadow-md"
            >
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{principal?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {principal?.roles.join(", ") || "sin rol"}
                </p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none hover:bg-accent"
                onSelect={() => navigate("/configuracion")}
              >
                <User className="size-4" /> Mi cuenta
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
                onSelect={handleLogout}
              >
                <LogOut className="size-4" /> Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
