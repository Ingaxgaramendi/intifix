import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Pause, Play, Search, Users } from "lucide-react";
import { useState } from "react";

import { Can } from "@/components/guards";
import { PageHeader, Pagination } from "@/components/common";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { Permission } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  full_name: string;
  status: string;
  role: string;
  is_verified: boolean;
  created_at: string | null;
}
interface Page {
  count: number;
  page: number;
  num_pages: number;
  results: User[];
}

const STATUSES = ["", "active", "suspended", "pending", "banned"];
const ROLES = ["", "client", "technician", "admin", "superadmin"];

export function UsuariosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["users", { search, status, role, page }],
    queryFn: async () => {
      const { data } = await api.get<Page>("/api/admin/users/", {
        params: { search: search || undefined, status: status || undefined, role: role || undefined, page },
      });
      return data;
    },
  });

  const action = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: "suspend" | "activate" | "ban" }) =>
      api.patch(`/api/admin/users/${id}/${verb}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const run = (id: string, verb: "suspend" | "activate" | "ban") => {
    if (verb === "ban" && !confirm("¿Banear a este usuario? Esta acción es severa.")) return;
    action.mutate({ id, verb });
  };

  return (
    <>
      <PageHeader title="Usuarios" description="Administra los usuarios de la plataforma" />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o correo…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || "Todos los estados"}</option>
            ))}
          </Select>
          <Select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r || "Todos los roles"}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <div className="p-4"><ErrorState message={apiErrorMessage(query.error)} /></div>
        ) : query.data!.results.length === 0 ? (
          <EmptyState icon={Users} title="Sin usuarios" description="No hay resultados para el filtro." />
        ) : (
          <>
            {action.isError && (
              <div className="p-4"><ErrorState message={apiErrorMessage(action.error)} /></div>
            )}
            <Table>
              <THead>
                <TR>
                  <TH>Usuario</TH>
                  <TH>Rol</TH>
                  <TH>Estado</TH>
                  <TH>Registro</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {query.data!.results.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <div className="font-medium">{u.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TD>
                    <TD><Badge variant="secondary">{u.role}</Badge></TD>
                    <TD><Badge variant={statusVariant(u.status)}>{u.status}</Badge></TD>
                    <TD className="text-sm text-muted-foreground">{formatDate(u.created_at)}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Can permission={Permission.USERS_ACTIVATE}>
                          <Button variant="ghost" size="icon" title="Reactivar"
                            onClick={() => run(u.id, "activate")} disabled={action.isPending}>
                            <Play className="text-success" />
                          </Button>
                        </Can>
                        <Can permission={Permission.USERS_SUSPEND}>
                          <Button variant="ghost" size="icon" title="Suspender"
                            onClick={() => run(u.id, "suspend")} disabled={action.isPending}>
                            <Pause className="text-warning" />
                          </Button>
                        </Can>
                        <Can permission={Permission.USERS_BAN}>
                          <Button variant="ghost" size="icon" title="Banear"
                            onClick={() => run(u.id, "ban")} disabled={action.isPending}>
                            <Ban className="text-destructive" />
                          </Button>
                        </Can>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={query.data!.page}
              numPages={query.data!.num_pages}
              count={query.data!.count}
              onPage={setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
