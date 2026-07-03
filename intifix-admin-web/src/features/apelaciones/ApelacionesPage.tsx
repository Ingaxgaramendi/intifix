import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Eye, MessageSquare, ShieldX } from "lucide-react";
import { useState } from "react";

import { PageHeader, Pagination } from "@/components/common";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn, formatDate } from "@/lib/utils";

interface Apelacion {
  idApelacion: string;
  correo: string;
  tipo: "SUSPENSION" | "BAN";
  mensaje: string;
  estado: "PENDIENTE" | "REVISADA" | "RESUELTA";
  notaAdmin: string | null;
  fechaEnvio: string | null;
}

interface Page {
  count: number;
  page: number;
  num_pages: number;
  results: Apelacion[];
}

const ESTADO_TABS = [
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "REVISADA", label: "Revisadas" },
  { value: "RESUELTA", label: "Resueltas" },
];

const ESTADO_OPTIONS = [
  { value: "REVISADA", label: "Marcar como revisada" },
  { value: "RESUELTA", label: "Marcar como resuelta" },
];

function tipoBadge(tipo: string) {
  if (tipo === "BAN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <Ban className="size-3" />
        Ban
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
      <ShieldX className="size-3" />
      Suspensión
    </span>
  );
}

export function ApelacionesPage() {
  const qc = useQueryClient();
  const [estado, setEstado] = useState("PENDIENTE");
  const [page, setPage] = useState(1);
  const [detailFor, setDetailFor] = useState<Apelacion | null>(null);

  const query = useQuery({
    queryKey: ["apelaciones", { estado, page }],
    queryFn: async () =>
      (
        await api.get<Page>("/api/admin/moderation/apelaciones/", {
          params: { estado, page },
        })
      ).data,
  });

  return (
    <>
      <PageHeader
        title="Apelaciones"
        description="Reclamos enviados por usuarios con cuenta suspendida o baneada"
      />

      {/* Estado tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ESTADO_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setPage(1);
              setEstado(tab.value);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              estado === tab.value
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
          <div className="p-4">
            <ErrorState message={apiErrorMessage(query.error)} />
          </div>
        ) : query.data?.results.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Sin apelaciones"
            description="No hay reclamos con este estado."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Correo</TH>
                  <TH>Tipo</TH>
                  <TH>Mensaje</TH>
                  <TH>Estado</TH>
                  <TH>Fecha</TH>
                  <TH className="text-right">Acción</TH>
                </TR>
              </THead>
              <TBody>
                {query.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonTableRow key={i} columns={6} />
                    ))
                  : query.data!.results.map((a) => (
                      <TR key={a.idApelacion}>
                        <TD>
                          <span className="font-medium text-sm">{a.correo}</span>
                        </TD>
                        <TD>{tipoBadge(a.tipo)}</TD>
                        <TD>
                          <span className="line-clamp-2 max-w-xs text-xs text-muted-foreground">
                            {a.mensaje}
                          </span>
                        </TD>
                        <TD>
                          <Badge variant={statusVariant(a.estado.toLowerCase())}>
                            {a.estado.toLowerCase()}
                          </Badge>
                        </TD>
                        <TD className="text-sm text-muted-foreground">
                          {formatDate(a.fechaEnvio)}
                        </TD>
                        <TD className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailFor(a)}
                          >
                            <Eye className="size-3.5" />
                            Ver
                          </Button>
                        </TD>
                      </TR>
                    ))}
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

      <ApelacionDialog
        apelacion={detailFor}
        onClose={() => setDetailFor(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["apelaciones"] });
          setDetailFor(null);
        }}
      />
    </>
  );
}

function ApelacionDialog({
  apelacion,
  onClose,
  onSaved,
}: {
  apelacion: Apelacion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nota, setNota] = useState("");

  const revisar = useMutation({
    mutationFn: () =>
      api.patch(`/api/admin/moderation/apelaciones/${apelacion!.idApelacion}/revisar/`, {
        estado: nuevoEstado,
        nota_admin: nota.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Apelación actualizada");
      onSaved();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const isResolved = apelacion?.estado === "RESUELTA";

  return (
    <Dialog.Root
      open={!!apelacion}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setNuevoEstado("");
          setNota("");
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-6 shadow-xl outline-none animate-fade-in-up">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Apelación — {apelacion?.correo}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
                Enviada el {formatDate(apelacion?.fechaEnvio ?? null)}
              </Dialog.Description>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {apelacion && tipoBadge(apelacion.tipo)}
              <Badge variant={statusVariant(apelacion?.estado?.toLowerCase() ?? "")}>
                {apelacion?.estado?.toLowerCase()}
              </Badge>
            </div>
          </div>

          {/* Mensaje completo */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Mensaje del usuario
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{apelacion?.mensaje}</p>
          </div>

          {/* Nota admin previa */}
          {apelacion?.notaAdmin && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-2">
                Nota del equipo
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{apelacion.notaAdmin}</p>
            </div>
          )}

          {/* Acciones (solo si no está resuelta) */}
          {!isResolved && (
            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actualizar estado
              </p>

              <div className="flex gap-2">
                {ESTADO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setNuevoEstado(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      nuevoEstado === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {opt.value === "RESUELTA" && (
                      <CheckCircle2 className="mx-auto mb-0.5 size-4" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Nota interna (opcional) — visible solo para el equipo de soporte"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  disabled={!nuevoEstado || revisar.isPending}
                  onClick={() => revisar.mutate()}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}

          {isResolved && (
            <div className="mt-5 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
