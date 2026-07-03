import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

type Action = { type: "ADD"; toast: ToastItem } | { type: "REMOVE"; id: string };

const ToastContext = createContext<{
  toasts: ToastItem[];
  dismiss: (id: string) => void;
} | null>(null);

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  if (action.type === "ADD") return [...state, action.toast];
  if (action.type === "REMOVE") return state.filter((t) => t.id !== action.id);
  return state;
}

let _add: ((message: string, variant: ToastVariant) => void) | null = null;

export const toast = {
  success: (message: string) => _add?.(message, "success"),
  error: (message: string) => _add?.(message, "error"),
  info: (message: string) => _add?.(message, "info"),
  warning: (message: string) => _add?.(message, "warning"),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const add = useCallback((message: string, variant: ToastVariant) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: "ADD", toast: { id, message, variant } });
    setTimeout(() => dispatch({ type: "REMOVE", id }), 4500);
  }, []);

  _add = add;

  const dismiss = useCallback((id: string) => dispatch({ type: "REMOVE", id }), []);

  return (
    <ToastContext.Provider value={{ toasts, dismiss }}>{children}</ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be inside ToastProvider");
  return ctx;
}
