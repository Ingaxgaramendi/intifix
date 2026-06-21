import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Eye, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Can } from "@/components/guards";
import { PageHeader, Pagination } from "@/components/common";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { Permission } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

interface Report {
  id: string;
  reason: string;
  status: string;
  reported_user_id: string | null;
  description: string;
  created_at: string | null;
}
interface Page {
  count: number;
  page: number;
  num_pages: number;
  results: Report[];
}

const STATUSES = ["", "pendiente", "en_revision", "resuelto"];

export function ReportesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detailFor, setDetailFor] = useState<Report | null>(null);

  const query = useQuery({
    queryKey: ["reports", { status, page }],
    queryFn: async () =>
      (await api.get<Page>("/api/admin/moderation/reports/", {
        params: { status: status || undefined, page },
      })).data,
  });

  const action = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: "review" | "resolve" }) =>
      api.patch(`/api/admin/moderation/reports/${id}/${verb}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  return (
    <>
      <PageHeader title="Reportes" description="Centro de moderación de reportes" />

      <Card className="mb-4">
        <div className="p-4">
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
          <EmptyState icon={ClipboardList} title="Sin reportes" />
        ) : (
          <>
            {action.isError && <div className="p-4"><ErrorState message={apiErrorMessage(action.error)} /></div>}
            <Table>
              <THead>
                <TR><TH>Motivo</TH><TH>Estado</TH><TH>Fecha</TH><TH className="text-right">Acciones</TH></TR>
              </THead>
              <TBody>
                {query.data!.results.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <div className="font-medium">{r.reason}</div>
                      <div className="max-w-md truncate text-xs text-muted-foreground">{r.description}</div>
                    </TD>
                    <TD><Badge variant={statusVariant(r.status)}>{r.status}</Badge></TD>
                    <TD className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Detalle" onClick={() => setDetailFor(r)}>
                          <Eye />
                        </Button>
                        <Can permission={Permission.REPORTS_REVIEW}>
                          <Button variant="ghost" size="sm" disabled={r.status !== "pendiente" || action.isPending}
                            onClick={() => action.mutate({ id: r.id, verb: "review" })}>
                            Revisar
                          </Button>
                        </Can>
                        <Can permission={Permission.REPORTS_RESOLVE}>
                          <Button variant="ghost" size="sm" disabled={r.status !== "en_revision" || action.isPending}
                            onClick={() => action.mutate({ id: r.id, verb: "resolve" })}>
                            <ShieldCheck className="text-success" /> Resolver
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

      <ReportDetailDialog report={detailFor} onClose={() => setDetailFor(null)} />
    </>
  );
}

interface HistoryEntry { action: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string | null; }
interface Comment { author_id: string; body: string; created_at: string | null; }

function ReportDetailDialog({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const history = useQuery({
    queryKey: ["report-history", report?.id],
    enabled: !!report,
    queryFn: async () =>
      (await api.get<{ history: HistoryEntry[] }>(`/api/admin/moderation/reports/${report!.id}/history/`)).data.history,
  });
  const comments = useQuery({
    queryKey: ["report-comments", report?.id],
    enabled: !!report,
    queryFn: async () =>
      (await api.get<{ comments: Comment[] }>(`/api/admin/moderation/reports/${report!.id}/comments/`)).data.comments,
  });
  const addComment = useMutation({
    mutationFn: () => api.post(`/api/admin/moderation/reports/${report!.id}/comments/`, { body: comment }),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["report-comments", report?.id] });
    },
  });

  return (
    <Dialog.Root open={!!report} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">Reporte — {report?.reason}</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">{report?.description}</Dialog.Description>

          <h3 className="mt-5 text-sm font-semibold">Historial</h3>
          <div className="mt-2 space-y-2">
            {history.isLoading && <LoadingState />}
            {history.data?.map((h, i) => (
              <div key={i} className="rounded-md border p-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{h.action}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                </div>
                {(h.from_status || h.to_status) && (
                  <p className="text-xs text-muted-foreground">{h.from_status} → {h.to_status}</p>
                )}
                {h.note && <p className="text-xs">{h.note}</p>}
              </div>
            ))}
            {history.data?.length === 0 && <p className="text-sm text-muted-foreground">Sin historial.</p>}
          </div>

          <h3 className="mt-5 text-sm font-semibold">Comentarios internos</h3>
          <div className="mt-2 space-y-2">
            {comments.data?.map((c, i) => (
              <div key={i} className="rounded-md bg-muted/50 p-2 text-sm">
                <p>{c.body}</p>
                <p className="text-xs text-muted-foreground">{c.author_id} · {formatDate(c.created_at)}</p>
              </div>
            ))}
          </div>

          <Can permission={Permission.REPORTS_COMMENT}>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (comment.trim()) addComment.mutate(); }}
            >
              <input
                className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="Añadir comentario interno…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={addComment.isPending}>
                <MessageSquarePlus /> Añadir
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
