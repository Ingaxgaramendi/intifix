import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  admin_id: string;
  accion: string;
  modulo: string;
  entidad: string | null;
  entidad_id: string | null;
  ip: string | null;
  fecha: string;
}
interface Result {
  count: number;
  limit: number;
  skip: number;
  results: AuditLog[];
}

const MODULES = ["", "auth", "users", "technicians", "moderation", "payments"];

export function AuditoriaPage() {
  const [modulo, setModulo] = useState("");
  const [adminId, setAdminId] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 50;

  const query = useQuery({
    queryKey: ["audit", { modulo, adminId, skip }],
    queryFn: async () =>
      (await api.get<Result>("/api/admin/audit/", {
        params: { modulo: modulo || undefined, admin_id: adminId || undefined, limit, skip },
      })).data,
  });

  return (
    <>
      <PageHeader title="Auditoría" description="Registro de acciones administrativas" />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <Input placeholder="Filtrar por admin_id…" value={adminId}
            onChange={(e) => { setSkip(0); setAdminId(e.target.value); }} />
          <Select value={modulo} onChange={(e) => { setSkip(0); setModulo(e.target.value); }}>
            {MODULES.map((m) => <option key={m} value={m}>{m || "Todos los módulos"}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <div className="p-4"><ErrorState message={apiErrorMessage(query.error)} /></div>
        ) : query.data!.results.length === 0 ? (
          <EmptyState icon={ScrollText} title="Sin registros de auditoría" />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Fecha</TH><TH>Admin</TH><TH>Acción</TH><TH>Módulo</TH><TH>Entidad</TH><TH>IP</TH>
                </TR>
              </THead>
              <TBody>
                {query.data!.results.map((log) => (
                  <TR key={log.id}>
                    <TD className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(log.fecha)}</TD>
                    <TD className="font-mono text-xs">{log.admin_id}</TD>
                    <TD><Badge>{log.accion}</Badge></TD>
                    <TD className="text-sm">{log.modulo}</TD>
                    <TD className="text-sm text-muted-foreground">
                      {log.entidad ? `${log.entidad}${log.entidad_id ? `:${log.entidad_id}` : ""}` : "—"}
                    </TD>
                    <TD className="font-mono text-xs text-muted-foreground">{log.ip ?? "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>{query.data!.count} registros</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={skip === 0}
                  onClick={() => setSkip(Math.max(0, skip - limit))}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={skip + limit >= query.data!.count}
                  onClick={() => setSkip(skip + limit)}>Siguiente</Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
