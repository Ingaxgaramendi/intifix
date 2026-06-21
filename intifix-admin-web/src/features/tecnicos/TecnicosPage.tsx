import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, Pause, Search, Wrench, X } from "lucide-react";
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

interface Technician {
  id: string;
  full_name: string;
  email: string;
  status: string;
  specialties: string[];
  rating: number | null;
}
interface Page {
  count: number;
  page: number;
  num_pages: number;
  results: Technician[];
}
interface Doc {
  type: string;
  url: string;
  verified: boolean;
}

const STATUSES = ["", "pending", "approved", "rejected", "suspended"];
const DOC_LABELS: Record<string, string> = {
  dni_front: "DNI (frontal)",
  dni_back: "DNI (posterior)",
  background_check: "Antecedentes",
  certificate: "Certificados",
};

export function TecnicosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [docsFor, setDocsFor] = useState<Technician | null>(null);

  const query = useQuery({
    queryKey: ["technicians", { search, status, page }],
    queryFn: async () =>
      (
        await api.get<Page>("/api/admin/technicians/", {
          params: { search: search || undefined, status: status || undefined, page },
        })
      ).data,
  });

  const action = useMutation({
    mutationFn: ({ id, verb, reason }: { id: string; verb: string; reason?: string }) =>
      api.patch(`/api/admin/technicians/${id}/${verb}/`, reason ? { reason } : {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["technicians"] }),
  });

  const reject = (id: string) => {
    const reason = prompt("Motivo del rechazo (obligatorio):");
    if (reason) action.mutate({ id, verb: "reject", reason });
  };

  return (
    <>
      <PageHeader title="Técnicos" description="Moderación y verificación de técnicos" />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar técnico…" value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          </div>
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || "Todos los estados"}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <div className="p-4"><ErrorState message={apiErrorMessage(query.error)} /></div>
        ) : query.data!.results.length === 0 ? (
          <EmptyState icon={Wrench} title="Sin técnicos" />
        ) : (
          <>
            {action.isError && <div className="p-4"><ErrorState message={apiErrorMessage(action.error)} /></div>}
            <Table>
              <THead>
                <TR>
                  <TH>Técnico</TH><TH>Especialidades</TH><TH>Estado</TH><TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {query.data!.results.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <div className="font-medium">{t.full_name}</div>
                      <div className="text-xs text-muted-foreground">{t.email}</div>
                    </TD>
                    <TD className="text-sm text-muted-foreground">{t.specialties.join(", ") || "—"}</TD>
                    <TD><Badge variant={statusVariant(t.status)}>{t.status}</Badge></TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Can permission={Permission.TECHNICIANS_DOCUMENTS_VIEW}>
                          <Button variant="ghost" size="icon" title="Ver documentos" onClick={() => setDocsFor(t)}>
                            <FileText />
                          </Button>
                        </Can>
                        <Can permission={Permission.TECHNICIANS_APPROVE}>
                          <Button variant="ghost" size="icon" title="Aprobar"
                            onClick={() => action.mutate({ id: t.id, verb: "approve" })} disabled={action.isPending}>
                            <Check className="text-success" />
                          </Button>
                        </Can>
                        <Can permission={Permission.TECHNICIANS_REJECT}>
                          <Button variant="ghost" size="icon" title="Rechazar"
                            onClick={() => reject(t.id)} disabled={action.isPending}>
                            <X className="text-destructive" />
                          </Button>
                        </Can>
                        <Can permission={Permission.TECHNICIANS_SUSPEND}>
                          <Button variant="ghost" size="icon" title="Suspender"
                            onClick={() => action.mutate({ id: t.id, verb: "suspend" })} disabled={action.isPending}>
                            <Pause className="text-warning" />
                          </Button>
                        </Can>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={query.data!.page} numPages={query.data!.num_pages} count={query.data!.count} onPage={setPage} />
          </>
        )}
      </Card>

      <DocumentsDialog technician={docsFor} onClose={() => setDocsFor(null)} />
    </>
  );
}

function DocumentsDialog({ technician, onClose }: { technician: Technician | null; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["technician-docs", technician?.id],
    enabled: !!technician,
    queryFn: async () =>
      (await api.get<{ documents: Doc[] }>(`/api/admin/technicians/${technician!.id}/documents/`)).data.documents,
  });

  return (
    <Dialog.Root open={!!technician} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">Documentos — {technician?.full_name}</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">Verificación KYC</Dialog.Description>
          <div className="mt-4 space-y-2">
            {query.isLoading && <LoadingState />}
            {query.isError && <ErrorState message={apiErrorMessage(query.error)} />}
            {query.data?.map((d) => (
              <a key={d.type} href={d.url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent">
                <span className="flex items-center gap-2"><FileText className="size-4" /> {DOC_LABELS[d.type] ?? d.type}</span>
                <Badge variant={d.verified ? "success" : "warning"}>{d.verified ? "verificado" : "pendiente"}</Badge>
              </a>
            ))}
            {query.data?.length === 0 && <EmptyState title="Sin documentos cargados" />}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
