import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Pause, Play, Search, Users } from "lucide-react";
import { useState } from "react";

import { Can } from "@/components/guards";
import { PageHeader, Pagination } from "@/components/common";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DropdownAction, type ActionEntry } from "@/components/ui/dropdown-action";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";
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

export function UsuariosPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmBan, setConfirmBan] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["users", { search, page }],
    queryFn: async () => {
      const { data } = await api.get<Page>("/api/admin/users/", {
        params: {
          search: search || undefined,
          page,
        },
      });
      return data;
    },
  });

  const action = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: "suspend" | "activate" | "ban" }) =>
      api.patch(`/api/admin/users/${id}/${verb}/`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      const msgs = { suspend: "Cliente suspendido", activate: "Cliente activado", ban: "Cliente baneado" };
      toast.success(msgs[vars.verb]);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const run = (id: string, verb: "suspend" | "activate") => action.mutate({ id, verb });

  return (
    <>
      <PageHeader title="Clientes" description="Directorio de clientes registrados en la plataforma" />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre completo…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
        </div>
      </Card>

      <Card>
        {query.isError ? (
          <div className="p-4"><ErrorState message={apiErrorMessage(query.error)} /></div>
        ) : query.data?.results.length === 0 ? (
          <EmptyState icon={Users} title="Sin clientes" description="No hay clientes con ese nombre." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Cliente</TH>
                  <TH>Verificado</TH>
                  <TH>Estado</TH>
                  <TH>Registro</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {query.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={5} />)
                  : query.data!.results.map((u) => {
                      const items: ActionEntry[] = [
                        {
                          label: "Reactivar",
                          icon: Play,
                          onClick: () => run(u.id, "activate"),
                          disabled: u.status !== "suspended" || action.isPending,
                          hidden: !can(Permission.USERS_ACTIVATE),
                        },
                        {
                          label: "Suspender",
                          icon: Pause,
                          onClick: () => run(u.id, "suspend"),
                          disabled: u.status !== "active" || action.isPending,
                          hidden: !can(Permission.USERS_SUSPEND),
                        },
                        { type: "separator" as const },
                        {
                          label: "Banear",
                          icon: Ban,
                          variant: "destructive" as const,
                          onClick: () => setConfirmBan(u.id),
                          disabled: u.status === "banned" || action.isPending,
                          hidden: !can(Permission.USERS_BAN),
                        },
                      ];
                      return (
                        <TR key={u.id}>
                          <TD>
                            <div className="font-medium">{u.full_name || "—"}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {u.email || `ID: ${u.id.slice(0, 8)}…`}
                            </div>
                          </TD>
                          <TD>
                            <Badge variant={u.is_verified ? "success" : "outline"}>
                              {u.is_verified ? "Verificado" : "Sin verificar"}
                            </Badge>
                          </TD>
                          <TD><Badge variant={statusVariant(u.status)}>{u.status}</Badge></TD>
                          <TD className="text-sm text-muted-foreground">{formatDate(u.created_at)}</TD>
                          <TD className="text-right">
                            <Can permission={Permission.USERS_SUSPEND}>
                              <DropdownAction items={items} disabled={action.isPending} />
                            </Can>
                          </TD>
                        </TR>
                      );
                    })}
              </TBody>
            </Table>
            {query.data && (
              <Pagination
                page={query.data.page}
                numPages={query.data.num_pages}
                count={query.data.count}
                onPage={setPage}
              />
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmBan}
        onOpenChange={(open) => !open && setConfirmBan(null)}
        title="¿Banear cliente?"
        description="Esta acción es severa. El cliente quedará bloqueado permanentemente de la plataforma."
        confirmLabel="Banear"
        variant="destructive"
        loading={action.isPending}
        onConfirm={() => {
          if (confirmBan) {
            action.mutate({ id: confirmBan, verb: "ban" });
            setConfirmBan(null);
          }
        }}
      />
    </>
  );
}
