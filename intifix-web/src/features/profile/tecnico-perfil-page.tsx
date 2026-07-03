import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  Power,
  BadgeCheck,
  FileText,
  Wrench,
  X,
  Plus,
  MapPin,
  ChevronRight,
  Star,
  Wallet,
  Upload,
  Eye,
  CheckCircle2,
  Camera,
  Pencil,
  Phone,
  Clock,
  Download,
} from "lucide-react";
import { paths } from "@/routes/paths";
import { uploadsApi } from "@/api/uploads";
import { AvatarUploadModal } from "@/components/profile/avatar-upload-modal";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, toViewableUrl } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { tecnicoNombre, type Tecnico } from "@/types/technician";
import {
  useActualizarCertificadoEspecialidad,
  useAsignarEspecialidad,
  useEspecialidadesCatalogo,
  useMisEspecialidades,
  useRemoverEspecialidad,
  useTecnicoProfile,
  useUpdateDisponibilidad,
  useUpdateDocumentos,
  useUpdateTecnico,
} from "./use-tecnico-profile";
import { EditarPerfilModal } from "./editar-perfil-modal";
import { CambiarPasswordModal } from "@/components/shared/cambiar-password-modal";

/**
 * Visor de documentos inline. PDFs: fetch → blob URL (sin descarga temporal).
 * Imágenes: <img> directo. El botón Descargar es el ÚNICO que guarda en disco.
 */
function DocViewerModal({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const isPdf = /\.pdf$/i.test(src);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <FileText className="h-5 w-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate font-medium text-sm">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          <a
            href={toViewableUrl(src)}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Descargar
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Cerrar visor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {isPdf ? (
        <PdfContent src={src} title={title} />
      ) : (
        <ImageContent src={src} title={title} />
      )}
    </div>
  );
}

function PdfContent({ src, title }: { src: string; title: string }) {
  // Google Docs Viewer renderiza el PDF en sus servidores — el iframe carga HTML, no el PDF
  // directo, por lo que funciona incluso si el navegador tiene "Descargar PDFs" activado.
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`;
  return (
    <div className="flex-1 min-h-0 w-full">
      <iframe
        src={viewerUrl}
        className="h-full w-full border-0 bg-white"
        title={title}
      />
    </div>
  );
}

function ImageContent({ src, title }: { src: string; title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center overflow-auto bg-muted/20 p-4">
      <img
        src={src}
        alt={title}
        className="max-w-full max-h-full object-contain rounded-lg shadow-md"
      />
    </div>
  );
}

/**
 * Modal genérico de subida de archivo con drag-and-drop, vista previa
 * y paso de confirmación antes de llamar a onConfirm.
 */
function FileUploadModal({
  title,
  subtitle,
  currentUrl,
  onConfirm,
  onClose,
  confirming = false,
}: {
  title: string;
  subtitle?: string;
  currentUrl?: string;
  onConfirm: (file: File) => void;
  onClose: () => void;
  confirming?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (f: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const isPdf = file?.type === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirming) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => !confirming && onClose()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
            disabled={confirming}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Documento actual */}
          {currentUrl && !file && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Archivo actual
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                {/\.pdf$/i.test(currentUrl) ? (
                  <div className="flex items-center gap-3 bg-muted/30 p-3">
                    <FileText className="h-8 w-8 shrink-0 text-primary" />
                    <p className="text-sm font-medium">PDF guardado</p>
                  </div>
                ) : (
                  <img
                    src={currentUrl}
                    alt="Documento actual"
                    className="max-h-28 w-full bg-muted/10 object-contain"
                  />
                )}
              </div>
            </div>
          )}

          {/* Zona de drop */}
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer select-none",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30",
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Arrastra el archivo o{" "}
              <span className="font-medium text-primary">haz clic aquí</span>
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP, PDF · máx 5 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={DOC_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.currentTarget.value = "";
              }}
            />
          </div>

          {/* Vista previa del nuevo archivo */}
          {file && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Vista previa
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                {preview ? (
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="max-h-48 w-full bg-muted/10 object-contain"
                  />
                ) : isPdf ? (
                  <div className="flex items-center gap-3 bg-muted/20 p-4">
                    <FileText className="h-9 w-9 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB · PDF
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={confirming}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!file || confirming}
            onClick={() => file && onConfirm(file)}
            className="gap-1.5"
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {confirming ? "Subiendo…" : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const DOC_FIELDS = [
  { key: "dniFrontalUrl", label: "DNI (frontal)" },
  { key: "dniTraseroUrl", label: "DNI (trasero)" },
  { key: "antecedentePenalUrl", label: "Antecedente penal" },
] as const;
type DocKey = (typeof DOC_FIELDS)[number]["key"];
const DOC_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";
const DOC_MAX_BYTES = 5 * 1024 * 1024;

/** Link rápido a páginas internas del técnico. */
function NavCard({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: typeof Star;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/** Chip de info rápida visible en el perfil. */
function InfoChip({ icon: Icon, text }: { icon: typeof Star; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span>{text}</span>
    </div>
  );
}

export function TecnicoPerfilPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario) ?? "";
  const telefonoRegistro = useAuthStore((s) => s.user?.telefono);

  const profile = useTecnicoProfile(idUsuario);
  const updateDisp = useUpdateDisponibilidad(idUsuario);
  const updateTecnico = useUpdateTecnico(idUsuario);

  const t = profile.data;
  const disponible = t?.disponibilidad === "DISPONIBLE";

  const [fotoUrl, setFotoUrl] = useState<string | undefined>();
  const [fotoModalOpen, setFotoModalOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [cambiarPassOpen, setCambiarPassOpen] = useState(false);

  const fotoActual = fotoUrl ?? (t?.fotoPerfilUrl as string | undefined);

  const onFotoSubida = (url: string) => {
    setFotoUrl(url);
    updateTecnico.mutate({ fotoPerfilUrl: url });
  };

  if (profile.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi perfil</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona tus datos, documentos y disponibilidad.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={paths.tecnico.miPerfilPublico}>
            <Eye className="h-4 w-4" /> Ver perfil público
          </Link>
        </Button>
      </header>

      {/* Tarjeta de presentación */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => setFotoModalOpen(true)}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
            aria-label="Cambiar foto de perfil"
          >
            {fotoActual ? (
              <img
                src={fotoActual}
                alt={t ? tecnicoNombre(t) : "Técnico"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                {tecnicoNombre(t ?? ({ idUsuario } as never))
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-bold leading-tight">
                {t ? tecnicoNombre(t) : "Técnico"}
              </p>
              {t?.estadoAprobacion && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t.estadoAprobacion}
                </span>
              )}
            </div>
            {t?.descripcion && (
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                {t.descripcion}
              </p>
            )}

            {/* Chips de info rápida */}
            <div className="mt-3 flex flex-wrap gap-2">
              {t?.experienciaAnios != null && (
                <InfoChip
                  icon={Clock}
                  text={`${t.experienciaAnios} año${t.experienciaAnios !== 1 ? "s" : ""} de experiencia`}
                />
              )}
              {t?.tarifaBase != null && (
                <InfoChip
                  icon={Wallet}
                  text={`Desde ${formatCurrency(t.tarifaBase)}`}
                />
              )}
              {t?.telefonoContacto && (
                <InfoChip icon={Phone} text={t.telefonoContacto} />
              )}
              {(t?.ubicacion?.distrito || t?.ubicacion?.departamento) && (
                <InfoChip
                  icon={MapPin}
                  text={[t.ubicacion.distrito, t.ubicacion.departamento]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
            </div>
          </div>
        </div>

        {/* Acciones del perfil */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                disponible ? "bg-emerald-500" : "bg-muted-foreground/50",
              )}
            />
            <p className="text-sm font-medium">
              {disponible ? "Disponible para servicios" : "No disponible"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={disponible ? "outline" : "default"}
              size="sm"
              disabled={updateDisp.isPending}
              onClick={() =>
                updateDisp.mutate(disponible ? "OCUPADO" : "DISPONIBLE")
              }
            >
              {updateDisp.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {disponible ? "Marcar ocupado" : "Marcar disponible"}
            </Button>
            <Button size="sm" onClick={() => setEditarOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar perfil
            </Button>
          </div>
        </div>
      </div>

      {/* Especialidades */}
      <EspecialidadesSection idUsuario={idUsuario} />

      {/* Links a páginas internas */}
      <NavCard
        to={paths.tecnico.reputacion}
        icon={Star}
        title="Mi reputación"
        desc="Promedios, reseñas y recomendaciones."
      />
      <NavCard
        to={paths.tecnico.ingresos}
        icon={Wallet}
        title="Mis ingresos"
        desc="Resumen de pagos y ganancias."
      />

      {/* Documentos */}
      <DocumentosSection idUsuario={idUsuario} tecnico={t} />

      {/* Seguridad */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <Lock className="h-5 w-5 text-primary" />
          Seguridad
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mantén tu cuenta protegida con una contraseña segura.
        </p>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCambiarPassOpen(true)}
          >
            <Lock className="h-4 w-4" />
            Cambiar contraseña
          </Button>
        </div>
      </div>

      {/* Modal de edición */}
      <EditarPerfilModal
        open={editarOpen}
        onClose={() => setEditarOpen(false)}
        idUsuario={idUsuario}
        tecnico={t}
        telefonoRegistro={telefonoRegistro}
      />

      <AvatarUploadModal
        open={fotoModalOpen}
        onClose={() => setFotoModalOpen(false)}
        currentUrl={fotoActual}
        onUploaded={onFotoSubida}
        nombre={t ? tecnicoNombre(t) : "Técnico"}
      />

      {cambiarPassOpen && (
        <CambiarPasswordModal onClose={() => setCambiarPassOpen(false)} />
      )}
    </div>
  );
}

/* ─────────────────── Especialidades ─────────────────── */

function EspecialidadesSection({ idUsuario }: { idUsuario: string }) {
  const catalogo = useEspecialidadesCatalogo();
  const mias = useMisEspecialidades(idUsuario);
  const asignar = useAsignarEspecialidad(idUsuario);
  const remover = useRemoverEspecialidad(idUsuario);
  const certificar = useActualizarCertificadoEspecialidad(idUsuario);
  const [seleccion, setSeleccion] = useState("");
  const [certModal, setCertModal] = useState<{
    idEspecialidad: string;
    nombre: string;
    certUrl?: string;
  } | null>(null);
  const [certUploading, setCertUploading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<{
    src: string;
    title: string;
  } | null>(null);

  const asignadas = mias.data ?? [];
  const asignadasIds = new Set(asignadas.map((e) => e.idEspecialidad));
  const disponibles = (catalogo.data ?? []).filter(
    (e) => !asignadasIds.has(e.idEspecialidad),
  );

  const onAdd = () => {
    if (!seleccion) return;
    asignar.mutate(seleccion, { onSuccess: () => setSeleccion("") });
  };

  const onCertConfirm = async (file: File) => {
    if (!certModal) return;
    if (!DOC_ACCEPT.split(",").includes(file.type)) {
      toast.error("Formato no permitido. Usa PNG, JPG o PDF.");
      return;
    }
    if (file.size > DOC_MAX_BYTES) {
      toast.error("El archivo no puede superar 5 MB.");
      return;
    }
    setCertUploading(true);
    try {
      const url = await uploadsApi.file(file);
      await certificar.mutateAsync({
        idEspecialidad: certModal.idEspecialidad,
        url,
      });
      toast.success("Certificado subido correctamente");
      setCertModal(null);
    } catch {
      toast.error("No se pudo subir el certificado");
    } finally {
      setCertUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="inline-flex items-center gap-2 font-semibold">
        <Wrench className="h-5 w-5 text-primary" />
        Especialidades y certificados
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Áreas en las que trabajas. Sube el certificado de cada una.
      </p>

      <div className="mt-5 space-y-2">
        {mias.isLoading ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : asignadas.length ? (
          asignadas.map((e) => {
            const cert = e.certificadoUrl as string | undefined;
            return (
              <div
                key={e.idEspecialidad}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    cert
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {cert ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Wrench className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.nombre}</p>
                  {cert ? (
                    <button
                      type="button"
                      onClick={() =>
                        setViewingPdf({
                          src: cert,
                          title: `Certificado — ${e.nombre}`,
                        })
                      }
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver certificado
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin certificado
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCertModal({
                      idEspecialidad: e.idEspecialidad,
                      nombre: e.nombre,
                      certUrl: cert,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Upload className="h-4 w-4" />
                  {cert ? "Reemplazar" : "Subir"}
                </button>
                <button
                  type="button"
                  aria-label={`Quitar ${e.nombre}`}
                  disabled={remover.isPending}
                  onClick={() => remover.mutate(e.idEspecialidad)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no has añadido especialidades.
          </p>
        )}
      </div>

      <div className="mt-5 flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="add-esp">Añadir especialidad</Label>
          <Select
            id="add-esp"
            value={seleccion}
            disabled={catalogo.isLoading || !disponibles.length}
            onChange={(e) => setSeleccion(e.target.value)}
          >
            <option value="">
              {catalogo.isLoading
                ? "Cargando…"
                : disponibles.length
                  ? "Selecciona…"
                  : "No hay más especialidades"}
            </option>
            {disponibles.map((e) => (
              <option key={e.idEspecialidad} value={e.idEspecialidad}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          onClick={onAdd}
          disabled={!seleccion || asignar.isPending}
        >
          {asignar.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Añadir
        </Button>
      </div>

      {viewingPdf && (
        <DocViewerModal
          src={viewingPdf.src}
          title={viewingPdf.title}
          onClose={() => setViewingPdf(null)}
        />
      )}

      {certModal && (
        <FileUploadModal
          key={certModal.idEspecialidad}
          title={`Subir certificado — ${certModal.nombre}`}
          subtitle="El certificado se guarda automáticamente al confirmar."
          currentUrl={certModal.certUrl}
          onConfirm={onCertConfirm}
          onClose={() => !certUploading && setCertModal(null)}
          confirming={certUploading}
        />
      )}
    </div>
  );
}

/* ─────────────────── Documentos ─────────────────── */

function DocumentosSection({
  idUsuario,
  tecnico,
}: {
  idUsuario: string;
  tecnico?: Tecnico;
}) {
  const updateDocs = useUpdateDocumentos(idUsuario);
  const [urls, setUrls] = useState<Record<DocKey, string>>(() => ({
    dniFrontalUrl: (tecnico?.dniFrontalUrl as string) ?? "",
    dniTraseroUrl: (tecnico?.dniTraseroUrl as string) ?? "",
    antecedentePenalUrl: (tecnico?.antecedentePenalUrl as string) ?? "",
  }));
  const [modalFor, setModalFor] = useState<{
    key: DocKey;
    label: string;
  } | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<{
    src: string;
    title: string;
  } | null>(null);

  const onDocConfirm = async (file: File) => {
    if (!modalFor) return;
    if (!DOC_ACCEPT.split(",").includes(file.type)) {
      toast.error("Formato no permitido. Usa PNG, JPG o PDF.");
      return;
    }
    if (file.size > DOC_MAX_BYTES) {
      toast.error("El archivo no puede superar 5 MB.");
      return;
    }
    setDocUploading(true);
    try {
      const url = await uploadsApi.file(file);
      setUrls((prev) => ({ ...prev, [modalFor.key]: url }));
      await updateDocs.mutateAsync({ [modalFor.key]: url } as Parameters<
        typeof updateDocs.mutate
      >[0]);
      toast.success("Documento guardado correctamente");
      setModalFor(null);
    } catch {
      toast.error("No se pudo subir el documento");
    } finally {
      setDocUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="inline-flex items-center gap-2 font-semibold">
        <FileText className="h-5 w-5 text-primary" />
        Documentos de verificación
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        PNG/JPG o PDF · Máx. 5 MB por archivo. Se guardan al confirmar.
      </p>

      <div className="mt-5 space-y-2">
        {DOC_FIELDS.map(({ key, label }) => {
          const url = urls[key];
          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  url
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {url ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{label}</p>
                {url ? (
                  <button
                    type="button"
                    onClick={() => setViewingPdf({ src: url, title: label })}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver archivo
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin subir</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalFor({ key, label })}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Upload className="h-4 w-4" />
                {url ? "Reemplazar" : "Subir"}
              </button>
            </div>
          );
        })}
      </div>

      {viewingPdf && (
        <DocViewerModal
          src={viewingPdf.src}
          title={viewingPdf.title}
          onClose={() => setViewingPdf(null)}
        />
      )}

      {modalFor && (
        <FileUploadModal
          key={modalFor.key}
          title={`Subir ${modalFor.label}`}
          subtitle="El documento se guarda automáticamente al confirmar."
          currentUrl={urls[modalFor.key] || undefined}
          onConfirm={onDocConfirm}
          onClose={() => !docUploading && setModalFor(null)}
          confirming={docUploading}
        />
      )}
    </div>
  );
}
