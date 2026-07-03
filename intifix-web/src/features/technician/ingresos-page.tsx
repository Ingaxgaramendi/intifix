import { Wallet, TrendingUp, CheckCircle2, Briefcase, AlertCircle } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format"
import { useIngresos } from "./use-ingresos"

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Wallet
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border border-primary/30 bg-primary/5 p-5"
          : "rounded-2xl border border-border bg-card p-5"
      }
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className={highlight ? "mt-1 text-3xl font-bold text-primary" : "mt-1 text-2xl font-bold"}>
        {value}
      </p>
    </div>
  )
}

export function IngresosPage() {
  const idTec = useAuthStore((s) => s.user?.idUsuario)
  const { data, isLoading, isError, refetch } = useIngresos(idTec)

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wallet className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis ingresos</h1>
          <p className="mt-1 text-muted-foreground">Lo que has ganado por tus trabajos cobrados.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="mt-4 font-medium">No pudimos calcular tus ingresos</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={TrendingUp}
              label="Ganancia neta"
              value={formatCurrency(data?.totalNeto ?? 0)}
              highlight
            />
            <StatCard
              icon={CheckCircle2}
              label="Trabajos cobrados"
              value={String(data?.cobrados ?? 0)}
            />
            <StatCard
              icon={Briefcase}
              label="Total de trabajos"
              value={String(data?.totalTrabajos ?? 0)}
            />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Detalle de pagos</h2>
            {!data || data.items.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Wallet className="h-7 w-7" />
                </span>
                <p className="mt-4 font-medium">Aún no tienes pagos cobrados</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuando finalices trabajos y el cliente pague, verás tus ingresos aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.items.map(({ idServicio, pago }) => (
                  <div
                    key={pago.idPago}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">Servicio #{idServicio.slice(0, 8)}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Total {formatCurrency(pago.montoTotal)} · comisión{" "}
                        {formatCurrency(pago.comisionPlataforma)}
                      </p>
                    </div>
                    <span className="shrink-0 text-lg font-bold text-primary">
                      {formatCurrency(pago.montoNetoTecnico)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
