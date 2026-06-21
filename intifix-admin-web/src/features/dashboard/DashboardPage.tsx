import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  CreditCard,
  MessageSquare,
  TriangleAlert,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, StatCard } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { api, apiErrorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

interface Summary {
  registered_users: number;
  approved_technicians: number;
  pending_technicians: number;
  active_services: number;
  completed_services: number;
  completed_payments: number;
  total_revenue: number;
  open_reports: number;
  active_conversations: number;
}

interface ChartPoint {
  label: string;
  value: number;
}
interface ChartSeries {
  key: string;
  title: string;
  type: string;
  points: ChartPoint[];
}

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => (await api.get<Summary>("/api/dashboard/summary/")).data,
  });
  const charts = useQuery({
    queryKey: ["dashboard", "charts"],
    queryFn: async () =>
      (await api.get<{ charts: ChartSeries[] }>("/api/dashboard/charts/")).data.charts,
  });

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) return <ErrorState message={apiErrorMessage(summary.error)} />;

  const s = summary.data!;

  return (
    <>
      <PageHeader title="Dashboard" description="Métricas de la plataforma en tiempo real" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios registrados" value={s.registered_users} icon={Users} />
        <StatCard label="Técnicos aprobados" value={s.approved_technicians} icon={BadgeCheck} accent="success" />
        <StatCard label="Técnicos pendientes" value={s.pending_technicians} icon={UserCheck} accent="warning" />
        <StatCard label="Servicios activos" value={s.active_services} icon={Activity} />
        <StatCard label="Servicios finalizados" value={s.completed_services} icon={Wrench} accent="success" />
        <StatCard label="Pagos realizados" value={s.completed_payments} icon={CreditCard} />
        <StatCard
          label="Ingresos totales"
          value={formatMoney(s.total_revenue)}
          icon={CreditCard}
          accent="success"
        />
        <StatCard label="Reportes abiertos" value={s.open_reports} icon={TriangleAlert} accent="destructive" />
        <StatCard label="Conversaciones activas" value={s.active_conversations} icon={MessageSquare} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {charts.isLoading && <LoadingState label="Cargando gráficos…" />}
        {charts.data?.map((serie) => (
          <Card key={serie.key}>
            <CardHeader>
              <CardTitle>{serie.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {serie.type === "bar" ? (
                  <BarChart data={serie.points}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} width={40} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={serie.points}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} width={40} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
