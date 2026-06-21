import { Moon, Sun } from "lucide-react";

import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";
import { useTheme } from "@/lib/theme";

export function ConfiguracionPage() {
  const { principal } = useAuth();
  const { theme, toggle } = useTheme();

  const roleNames = principal?.roles ?? [];

  return (
    <>
      <PageHeader title="Configuración" description="Preferencias y datos de la cuenta" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mi cuenta</CardTitle>
            <CardDescription>Información del administrador autenticado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="ID" value={principal?.id || "—"} mono />
            <Row label="Correo" value={principal?.email || "—"} />
            <div>
              <p className="text-muted-foreground">Roles</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {roleNames.length ? (
                  roleNames.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>Tema de la interfaz</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={toggle}>
              {theme === "dark" ? <Sun /> : <Moon />}
              Cambiar a tema {theme === "dark" ? "claro" : "oscuro"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Permisos efectivos</CardTitle>
            <CardDescription>
              Capacidades otorgadas por tus roles (RBAC, principio de mínimo privilegio)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {roleNames
              .map(normalizeRole)
              .filter((r): r is NonNullable<typeof r> => r !== null)
              .flatMap((r) => ROLE_PERMISSIONS[r])
              .filter((p, i, arr) => arr.indexOf(p) === i)
              .map((p) => (
                <Badge key={p} variant="outline" className="font-mono text-[11px]">{p}</Badge>
              ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-xs" : ""}>{value}</p>
    </div>
  );
}
