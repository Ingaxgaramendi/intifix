import { Moon, Sun } from "lucide-react";

import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";
import { useTheme } from "@/lib/theme";

const PERM_GROUPS: Array<{ label: string; perms: string[] }> = [
  { label: "Dashboard", perms: ["dashboard.view"] },
  {
    label: "Usuarios",
    perms: ["users.view", "users.suspend", "users.activate", "users.ban", "users.block", "users.unblock"],
  },
  {
    label: "Técnicos",
    perms: [
      "technicians.view",
      "technicians.documents.view",
      "technicians.approve",
      "technicians.reject",
      "technicians.suspend",
    ],
  },
  {
    label: "Reportes",
    perms: ["reports.view", "reports.review", "reports.resolve", "reports.comment"],
  },
  { label: "Pagos", perms: ["payments.view", "payments.refund"] },
  { label: "Soporte", perms: ["support.view"] },
  { label: "Auditoría", perms: ["audit.view"] },
];

export function ConfiguracionPage() {
  const { principal } = useAuth();
  const { theme, toggle } = useTheme();

  const roleNames = principal?.roles ?? [];
  const displayName = (principal?.email ?? "").split("@")[0] || "Administrador";
  const initials = displayName.slice(0, 2).toUpperCase() || "AD";

  const effectivePerms = new Set(
    roleNames
      .map(normalizeRole)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .flatMap((r) => ROLE_PERMISSIONS[r]),
  );

  return (
    <>
      <PageHeader title="Configuración" description="Preferencias y datos de la cuenta" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-sm text-muted-foreground">{principal?.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {roleNames.length ? (
                    roleNames.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs">
                        {r}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">sin rol</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 divide-y">
              <Row label="ID de cuenta" value={principal?.id ?? "—"} mono />
              <Row label="Correo electrónico" value={principal?.email ?? "—"} />
              <Row label="Roles asignados" value={roleNames.join(", ") || "—"} />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>Personaliza la interfaz del panel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Tema de color</p>
                <p className="text-xs text-muted-foreground">
                  Actualmente: {theme === "dark" ? "Oscuro" : "Claro"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={toggle} className="gap-2 shrink-0">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {theme === "dark" ? "Claro" : "Oscuro"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Permisos efectivos</CardTitle>
            <CardDescription>
              Capacidades otorgadas por tus roles (RBAC · principio de mínimo privilegio)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {effectivePerms.size === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes permisos asignados. Contacta con un super administrador.
              </p>
            ) : (
              <div className="space-y-4">
                {PERM_GROUPS.map((group) => {
                  const relevant = group.perms.filter((p) => (effectivePerms as Set<string>).has(p));
                  if (relevant.length === 0) return null;
                  return (
                    <div key={group.label}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {relevant.map((p) => (
                          <Badge key={p} variant="outline" className="font-mono text-[11px]">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <p className="text-sm text-muted-foreground shrink-0">{label}</p>
      <p className={mono ? "font-mono text-xs text-right" : "text-sm text-right"}>{value}</p>
    </div>
  );
}
