import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createPortal } from "react-dom";

import { useToastContext, type ToastVariant } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
};

const STYLES: Record<ToastVariant, { bar: string; icon: string }> = {
  success: { bar: "border-l-success", icon: "text-success" },
  error: { bar: "border-l-destructive", icon: "text-destructive" },
  warning: { bar: "border-l-warning", icon: "text-warning" },
  info: { bar: "border-l-primary", icon: "text-primary" },
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastContext();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        const style = STYLES[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              "flex w-80 items-start gap-3 rounded-lg border border-l-4 bg-card p-4 text-sm shadow-lg animate-toast-in",
              style.bar,
            )}
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", style.icon)} />
            <p className="flex-1 text-card-foreground leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 flex size-4 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
