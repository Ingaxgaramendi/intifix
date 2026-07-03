import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Eye, FileText, Pause, Play, Search, Wrench, X } from "lucide-react";
import { useState } from "react";

import { PageHeader, Pagination } from "@/components/common";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/dialog";
import { DropdownAction, type ActionEntry } from "@/components/ui/dropdown-action";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/input";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";
import { Permission } from "@/lib/rbac";
import { cn, formatDate, toViewableUrl } from "@/lib/utils";

interface Technician {
  id: string;
  full_name: string;
  email: string;
  status: string;
  specialties: string[];
  rating: number | null;
  created_at?: string | null;
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
  uploaded_at?: string | null;
  label?: string | null;
}

const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "suspended", label: "Suspendidos" },
  { value: "rejected", label: "Rechazados" },
];

const DOC_LABELS: Record<string, string> = {
  dni_front: "DNI (frontal)",
  dni_back: "DNI (posterior)",
  background_check: "Antecedentes penales",
  certificate: "Certificados técnicos",
};

export function TecnicosPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [docsFor, setDocsFor] = useState<Technician | null>(null);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      const msgs: Record<string, string> = {
        approve: "Técnico aprobado exitosamente",
        reject: "Técnico rechazado",
        suspend: "Técnico suspendido",
        reactivate: "Técnico reactivado exitosamente",
      };
      toast.success(msgs[vars.verb] ?? "Acción completada");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <>
      <PageHeader title="Técnicos" description="Moderación y verificación de técnicos de servicio" />

      {/* Status pill tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setPage(1); setStatus(tab.value); }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              status === tab.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar técnico…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            {STATUS_TABS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        {query.isError ? (
          <div className="p-4"><ErrorState message={apiErrorMessage(query.error)} /></div>
        ) : query.data?.results.length === 0 ? (
          <EmptyState icon={Wrench} title="Sin técnicos" description="No hay técnicos con ese filtro." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Técnico</TH>
                  <TH>Especialidades</TH>
                  <TH>Estado</TH>
                  <TH>Registro</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {query.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={5} />)
                  : query.data!.results.map((t) => {
                      const items: ActionEntry[] = [
                        {
                          label: "Ver documentos",
                          icon: FileText,
                          onClick: () => setDocsFor(t),
                          hidden: !can(Permission.TECHNICIANS_DOCUMENTS_VIEW),
                        },
                        { type: "separator" as const },
                        {
                          label: "Aprobar",
                          icon: Check,
                          onClick: () => action.mutate({ id: t.id, verb: "approve" }),
                          disabled: t.status === "approved" || action.isPending,
                          hidden: !can(Permission.TECHNICIANS_APPROVE),
                        },
                        {
                          label: "Suspender",
                          icon: Pause,
                          onClick: () => action.mutate({ id: t.id, verb: "suspend" }),
                          disabled: t.status !== "approved" || action.isPending,
                          hidden: !can(Permission.TECHNICIANS_SUSPEND),
                        },
                        {
                          label: "Reactivar",
                          icon: Play,
                          onClick: () => action.mutate({ id: t.id, verb: "reactivate" }),
                          disabled: t.status !== "suspended" || action.isPending,
                          hidden: !can(Permission.TECHNICIANS_SUSPEND),
                        },
                        {
                          label: "Rechazar",
                          icon: X,
                          variant: "destructive" as const,
                          onClick: () => setRejectFor(t.id),
                          disabled: t.status === "rejected" || action.isPending,
                          hidden: !can(Permission.TECHNICIANS_REJECT),
                        },
                      ];
                      return (
                        <TR key={t.id}>
                          <TD>
                            <div className="font-medium">{t.full_name}</div>
                            <div className="text-xs text-muted-foreground">{t.email}</div>
                          </TD>
                          <TD className="text-sm text-muted-foreground">
                            {t.specialties.length > 0 ? t.specialties.join(", ") : "—"}
                          </TD>
                          <TD><Badge variant={statusVariant(t.status)}>{t.status}</Badge></TD>
                          <TD className="text-sm text-muted-foreground">
                            {formatDate(t.created_at ?? null)}
                          </TD>
                          <TD className="text-right">
                            <DropdownAction items={items} disabled={action.isPending} />
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

      <DocumentsDialog
        technician={docsFor}
        onClose={() => setDocsFor(null)}
        onApprove={(id) => { action.mutate({ id, verb: "approve" }); setDocsFor(null); }}
        onReject={(id) => { setDocsFor(null); setRejectFor(id); }}
        canApprove={can(Permission.TECHNICIANS_APPROVE)}
        canReject={can(Permission.TECHNICIANS_REJECT)}
      />

      <FormDialog
        open={!!rejectFor}
        onOpenChange={(open) => !open && setRejectFor(null)}
        title="Rechazar técnico"
        description="Ingresa el motivo del rechazo. Será registrado en el historial del técnico."
        confirmLabel="Rechazar"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={action.isPending}
        inputLabel="Motivo del rechazo"
        inputPlaceholder="Describe el motivo de forma clara y objetiva…"
        required
        value={rejectReason}
        onChange={setRejectReason}
        onConfirm={() => {
          if (rejectFor && rejectReason.trim()) {
            action.mutate({ id: rejectFor, verb: "reject", reason: rejectReason });
            setRejectFor(null);
          }
        }}
      />
    </>
  );
}

function DocumentsDialog({
  technician,
  onClose,
  onApprove,
  onReject,
  canApprove,
  canReject,
}: {
  technician: Technician | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  canApprove: boolean;
  canReject: boolean;
}) {
  const query = useQuery({
    queryKey: ["technician-docs", technician?.id],
    enabled: !!technician,
    queryFn: async () =>
      (
        await api.get<{ documents: Doc[] }>(
          `/api/admin/technicians/${technician!.id}/documents/`,
        )
      ).data.documents,
  });

  const [viewingDoc, setViewingDoc] = useState<{ url: string; label: string } | null>(null);

  return (
    <>
      <Dialog.Root open={!!technician} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl outline-none animate-fade-in-up">
            <Dialog.Title className="text-base font-semibold">
              Documentos KYC — {technician?.full_name}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {technician?.email}
            </Dialog.Description>

            <div className="mt-4">
              {query.isLoading && <LoadingState label="Cargando documentos…" />}
              {query.isError && <ErrorState message={apiErrorMessage(query.error)} />}
              {query.data && query.data.length === 0 && (
                <EmptyState title="Sin documentos cargados" description="El técnico aún no subió sus documentos." />
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {query.data?.map((d, i) => {
                  const label = d.label || (DOC_LABELS[d.type] ?? d.type);
                  return (
                    <div key={`${d.type}-${i}`} className="flex flex-col rounded-lg border p-3 text-sm gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{label}</p>
                          <Badge variant={d.verified ? "success" : "warning"} className="mt-0.5 text-[10px]">
                            {d.verified ? "verificado" : "pendiente"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1 text-xs h-7"
                          onClick={() => setViewingDoc({ url: d.url, label })}
                        >
                          <Eye className="size-3" /> Ver PDF
                        </Button>
                        <a
                          href={toViewableUrl(d.url)}
                          download
                          className="inline-flex items-center justify-center gap-1 flex-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent h-7 transition-colors"
                        >
                          <Download className="size-3" /> Descargar
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                {canApprove && (
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5"
                    onClick={() => technician && onApprove(technician.id)}
                  >
                    <Check className="size-3.5" /> Aprobar
                  </Button>
                )}
                {canReject && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => technician && onReject(technician.id)}
                  >
                    <X className="size-3.5" /> Rechazar
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <PdfViewerDialog doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </>
  );
}

function PdfViewerDialog({ doc, onClose }: { doc: { url: string; label: string } | null; onClose: () => void }) {
  const isPdf = !!doc && /\.pdf$/i.test(doc.url);
  return (
    <Dialog.Root open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-4 z-[60] flex flex-col rounded-xl border bg-card shadow-2xl outline-none md:inset-8">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <FileText className="size-4 shrink-0 text-primary" />
            <Dialog.Title className="flex-1 truncate text-sm font-semibold">
              {doc?.label}
            </Dialog.Title>
            <div className="flex items-center gap-1.5">
              {doc && (
                <a
                  href={toViewableUrl(doc.url)}
                  download
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <Download className="size-3" /> Descargar
                </a>
              )}
              <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors">
                <X className="size-4" />
              </Dialog.Close>
            </div>
          </div>
          {doc && (
            isPdf
              ? <AdminPdfContent src={doc.url} title={doc.label} />
              : <AdminImageContent src={doc.url} title={doc.label} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AdminPdfContent({ src, title }: Readonly<{ src: string; title: string }>) {
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`
  return (
    <div className="flex-1 min-h-0 w-full">
      <iframe src={viewerUrl} className="h-full w-full rounded-b-xl border-0 bg-white" title={title} />
    </div>
  );
}

function AdminImageContent({ src, title }: Readonly<{ src: string; title: string }>) {
  return (
    <div className="flex-1 flex items-center justify-center overflow-auto bg-muted/20 p-4 rounded-b-xl">
      <img src={src} alt={title} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
    </div>
  );
}
