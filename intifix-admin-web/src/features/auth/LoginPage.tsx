import { AlertCircle, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function LoginPage() {
  const { principal, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (principal) {
    const from = (location.state as { from?: string })?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center px-12 text-center animate-fade-in-up">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-6 ring-1 ring-white/20">
            <ShieldCheck className="size-9 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Intifix Admin</h1>
          <p className="mt-4 max-w-xs text-lg leading-relaxed text-indigo-200/80">
            Panel de operaciones para gestionar la plataforma de servicios técnicos
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {["Técnicos verificados", "Reportes en tiempo real", "Control RBAC"].map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <ShieldCheck className="size-6 text-primary" />
            <span className="text-lg font-semibold">Intifix Admin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Bienvenido de vuelta</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Inicia sesión para acceder al panel
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@intifix.com"
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10"
              />
            </div>
            <Button type="submit" className="mt-2 h-10 w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner />
                  Ingresando…
                </>
              ) : (
                "Ingresar al panel"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
