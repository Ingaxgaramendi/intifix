import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Eye, MessageSquarePlus, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Can } from "@/components/guards";
import { PageHeader, Pagination } from "@/components/common";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownAction, type ActionEntry } from "@/components/ui/dropdown-action";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Permission } from "@/lib/rbac";
import { cn, formatDate } from "@/lib/utils";

interface Report {
  id: string;
  reason: string;
  status: string;
  reported_user_id: string | null;
  id_servicio?: string | null;
  description: string;
  created_at: string | null;
}
interface Page {
  count: number;
  page: number;
  num_pages: number;
  results: Report[];
}

// Spring has no "get all" endpoint — default view shows pending reports.
const STATUS_TABS = [
  { value: "", label: "Pendientes" },
  { value: "en_revision", label: "En revisión" },
  { value: "resuelto", label: "Resueltos" },
];

export function ReportesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detailFor, setDetailFor] = useState<Report | null>(null);

  const query = useQuery({
    queryKey: ["reports", { status, page }],
    queryFn: async () =>
      (
        await api.get<Page>("/api/admin/moderation/reports/", {
          params: { status: status || undefined, page },
        })
      ).data,
  });

  const action = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: "review" | "resolve" }) =>
      api.patch(`/api/admin/moderation/reports/${id}/${verb}/`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success(vars.verb === "review" ? "Reporte en revisión" : "Reporte resuelto");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <>
      <PageHeader title="Reportes" description="Centro de moderación de contenido y usuarios" />

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

      <Card>
        {query.isError ? (
          <div className="p-4"><ErrorState message={apiErrorMessage(query.error)} /></div>
        ) : query.data?.results.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Sin reportes" description="No hay reportes con ese filtro." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Motivo</TH>
                  <TH>Estado</TH>
                  <TH>Fecha</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {query.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={4} />)
                  : query.data!.results.map((r) => {
                      const items: ActionEntry[] = [
                        {
                          label: "Ver detalle",
                          icon: Eye,
                          onClick: () => setDetailFor(r),
                        },
                        { type: "separator" as const },
                        {
                          label: "Poner en revisión",
                          icon: RotateCcw,
                          onClick: () => action.mutate({ id: r.id, verb: "review" }),
                          disabled: r.status !== "pendiente" || action.isPending,
                          hidden: false,
                        },
                        {
                          label: "Resolver",
                          icon: CheckCircle2,
                          onClick: () => action.mutate({ id: r.id, verb: "resolve" }),
                          disabled: r.status !== "en_revision" || action.isPending,
                          hidden: false,
                        },
                      ];
                      return (
                        <TR key={r.id}>
                          <TD>
                            <div className="font-medium">{r.reason}</div>
                            <div className="max-w-md truncate text-xs text-muted-foreground">
                              {r.description}
                            </div>
                          </TD>
                          <TD><Badge variant={statusVariant(r.status)}>{r.status}</Badge></TD>
                          <TD className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TD>
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

      <ReportDetailDialog report={detailFor} onClose={() => setDetailFor(null)} />
    </>
  );
}

interface HistoryEntry {
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string | null;
}
interface Comment {
  author_id: string;
  body: string;
  created_at: string | null;
}

function ReportDetailDialog({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const history = useQuery({
    queryKey: ["report-history", report?.id],
    enabled: !!report,
    queryFn: async () =>
      (
        await api.get<{ history: HistoryEntry[] }>(
          `/api/admin/moderation/reports/${report!.id}/history/`,
        )
      ).data.history,
  });
  const comments = useQuery({
    queryKey: ["report-comments", report?.id],
    enabled: !!report,
    queryFn: async () =>
      (
        await api.get<{ comments: Comment[] }>(
          `/api/admin/moderation/reports/${report!.id}/comments/`,
        )
      ).data.comments,
  });
  const addComment = useMutation({
    mutationFn: () =>
      api.post(`/api/admin/moderation/reports/${report!.id}/comments/`, { body: comment }),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["report-comments", report?.id] });
      toast.success("Comentario añadido");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <Dialog.Root open={!!report} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-6 shadow-xl outline-none animate-fade-in-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Reporte — {report?.reason}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {report?.description}
              </Dialog.Description>
              {report?.id_servicio && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Servicio: <span className="font-mono text-foreground">{report.id_servicio}</span>
                </p>
              )}
            </div>
            <Badge variant={statusVariant(report?.status ?? "")} className="shrink-0 mt-0.5">
              {report?.status}
            </Badge>
          </div>

          {/* History timeline */}
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Historial
          </h3>
          <div className="mt-3">
            {history.isLoading && (
              <div className="h-16 animate-pulse rounded-lg bg-muted" />
            )}
            {history.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin historial registrado.</p>
            )}
            {history.data?.map((h, i) => {
              const isLast = i === (history.data?.length ?? 0) - 1;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className={cn("pb-4", isLast && "pb-0")}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{h.action}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                    </div>
                    {(h.from_status || h.to_status) && (
                      <p className="text-xs text-muted-foreground">
                        {h.from_status} → {h.to_status}
                      </p>
                    )}
                    {h.note && <p className="mt-0.5 text-xs">{h.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Internal comments */}
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Comentarios internos
          </h3>
          <div className="mt-3 space-y-2">
            {comments.data?.map((c, i) => (
              <div key={i} className="rounded-lg bg-muted/50 p-3 text-sm">
                <p>{c.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.author_id} · {formatDate(c.created_at)}
                </p>
              </div>
            ))}
            {comments.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin comentarios.</p>
            )}
          </div>

          <Can permission={Permission.REPORTS_COMMENT}>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) addComment.mutate();
              }}
            >
              <Input
                placeholder="Añadir comentario interno…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={addComment.isPending || !comment.trim()}>
                <MessageSquarePlus className="size-4" />
                Añadir
              </Button>
            </form>
          </Can>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
