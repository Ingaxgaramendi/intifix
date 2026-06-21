import { useQuery } from "@tanstack/react-query";
import { CreditCard, Search } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";

interface Payment {
  id: string | number;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
  user_id?: string;
  created_at?: string;
}

/** The payments service shape is upstream-defined; read defensively. */
function normalize(data: any): Payment[] {
  const rows = Array.isArray(data) ? data : (data?.results ?? []);
  return Array.isArray(rows) ? rows : [];
}

export function PagosPage() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["payments", { search }],
    queryFn: async () =>
      normalize((await api.get("/api/v1/payments/", { params: { search: search || undefined } })).data),
  });

  return (
    <>
      <PageHeader title="Pagos" description="Transacciones procesadas en la plataforma" />

      <Card className="mb-4">
        <div className="relative p-4">
          <Search className="absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar pago…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card>
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <div className="p-4"><ErrorState message={apiErrorMessage(query.error)} /></div>
        ) : query.data!.length === 0 ? (
          <EmptyState icon={CreditCard} title="Sin pagos" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>ID</TH><TH>Monto</TH><TH>Método</TH><TH>Estado</TH><TH>Fecha</TH>
              </TR>
            </THead>
            <TBody>
              {query.data!.map((p) => (
                <TR key={String(p.id)}>
                  <TD className="font-mono text-xs">{p.id}</TD>
                  <TD className="font-medium">{formatMoney(p.amount, p.currency ?? "PEN")}</TD>
                  <TD className="text-sm text-muted-foreground">{p.method ?? "—"}</TD>
                  <TD>{p.status ? <Badge variant={statusVariant(p.status)}>{p.status}</Badge> : "—"}</TD>
                  <TD className="text-sm text-muted-foreground">{formatDate(p.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
