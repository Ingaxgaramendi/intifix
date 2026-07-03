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
  BarChart2,
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
import { ErrorState } from "@/components/ui/feedback";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

interface ChartPoint { label: string; value: number; }
interface ChartSeries { key: string; title: string; type: string; points: ChartPoint[]; }

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    fontSize: "12px",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  },
  cursor: { stroke: "hsl(var(--border))" },
};

export function DashboardPage() {
  const { principal } = useAuth();

  const summary = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => (await api.get<Summary>("/api/dashboard/summary/")).data,
  });
  const charts = useQuery({
    queryKey: ["dashboard", "charts"],
    queryFn: async () =>
      (await api.get<{ charts: ChartSeries[] }>("/api/dashboard/charts/")).data.charts,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const userName = (principal?.email ?? "").split("@")[0] || "Administrador";

  if (summary.isError) return <ErrorState message={apiErrorMessage(summary.error)} />;

  if (summary.isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 h-9 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 animate-pulse rounded-lg bg-muted" />
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  const s = summary.data!;

  return (
    <>
      <PageHeader
        title={`${greeting}, ${userName}`}
        description="Métricas de la plataforma en tiempo real"
        actions={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            En vivo
          </span>
        }
      />

      {/* Row 1 — primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios registrados" value={s.registered_users} icon={Users} />
        <StatCard
          label="Técnicos aprobados"
          value={s.approved_technicians}
          icon={BadgeCheck}
          accent="success"
        />
        <StatCard label="Servicios activos" value={s.active_services} icon={Activity} />
        <StatCard
          label="Ingresos totales"
          value={formatMoney(s.total_revenue)}
          icon={CreditCard}
          accent="success"
        />
      </div>

      {/* Row 2 — secondary / alert KPIs */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Técnicos pendientes"
          value={s.pending_technicians}
          icon={UserCheck}
          accent="warning"
        />
        <StatCard
          label="Reportes abiertos"
          value={s.open_reports}
          icon={TriangleAlert}
          accent="destructive"
        />
        <StatCard
          label="Servicios finalizados"
          value={s.completed_services}
          icon={Wrench}
          accent="success"
        />
        <StatCard label="Pagos realizados" value={s.completed_payments} icon={CreditCard} />
        <StatCard label="Conversaciones" value={s.active_conversations} icon={MessageSquare} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {charts.isLoading && (
          <>
            <div className="lg:col-span-2 h-80 animate-pulse rounded-lg border bg-muted" />
            <div className="h-80 animate-pulse rounded-lg border bg-muted" />
          </>
        )}
        {charts.data?.map((serie, idx) => (
          <Card
            key={serie.key}
            className={idx === 0 && (charts.data?.length ?? 0) > 1 ? "lg:col-span-2" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{serie.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {serie.points.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <BarChart2 className="size-8 opacity-30" />
                  <p className="text-xs">Sin datos disponibles</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {serie.type === "bar" ? (
                    <BarChart data={serie.points}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={serie.points}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
