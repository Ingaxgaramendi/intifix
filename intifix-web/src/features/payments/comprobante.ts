import { formatCurrency } from "@/lib/format"

/** Datos del emisor (la plataforma). Ficticios pero realistas para Perú. */
export const EMISOR = {
  razonSocial: "INTIFIX S.A.C.",
  ruc: "20612345678",
  direccion: "Av. Javier Prado Este 123, San Isidro, Lima",
}

export interface ComprobanteData {
  tipo: "BOLETA" | "FACTURA" | "NOTA_CREDITO"
  codigo: string
  fecha?: string
  cliente: string
  clienteDoc?: string
  servicio: string
  montoNetoTecnico: number
  comisionBruta: number
  impuestoTotal: number
  montoTotal: number
  metodo?: string
  transactionId?: string
}

const TIPO_LABEL: Record<ComprobanteData["tipo"], string> = {
  BOLETA: "BOLETA DE VENTA ELECTRÓNICA",
  FACTURA: "FACTURA ELECTRÓNICA",
  NOTA_CREDITO: "NOTA DE CRÉDITO ELECTRÓNICA",
}

function fmtFecha(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString("es-PE")
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** HTML autocontenido del comprobante (para imprimir / guardar como PDF). */
export function comprobanteHtml(d: ComprobanteData): string {
  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td class="lbl${strong ? " strong" : ""}">${label}</td>
      <td class="val${strong ? " strong" : ""}">${value}</td>
    </tr>`

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<title>${TIPO_LABEL[d.tipo]} ${d.codigo}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1c1917; margin: 0; padding: 32px; background: #fff; }
  .doc { max-width: 720px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
  .brand { font-size: 26px; font-weight: 800; color: #7a1f3d; letter-spacing: -.5px; }
  .brand small { display: block; font-size: 12px; font-weight: 500; color: #57534e; letter-spacing: 0; margin-top: 4px; }
  .box { border: 2px solid #7a1f3d; border-radius: 12px; padding: 14px 18px; text-align: center; min-width: 230px; }
  .box .ruc { font-size: 13px; font-weight: 700; }
  .box .tipo { font-size: 13px; font-weight: 700; margin: 6px 0; }
  .box .cod { font-size: 18px; font-weight: 800; color: #7a1f3d; }
  hr { border: none; border-top: 1px solid #e7e5e4; margin: 22px 0; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 13px; }
  .meta b { color: #57534e; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
  td { padding: 8px 4px; border-bottom: 1px solid #f0eeec; }
  td.val { text-align: right; font-variant-numeric: tabular-nums; }
  td.lbl { color: #57534e; }
  .strong { font-weight: 800; font-size: 16px; border-bottom: none; padding-top: 14px; }
  .note { margin-top: 6px; font-size: 11px; color: #78716c; }
  .foot { margin-top: 28px; text-align: center; font-size: 11px; color: #a8a29e; }
  .bar { text-align: center; margin-bottom: 20px; }
  .bar button { background: #7a1f3d; color: #fff; border: none; border-radius: 8px;
    padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; }
  @media print { body { padding: 0; } .doc { max-width: none; } .bar { display: none; } }
</style></head>
<body>
  <div class="doc">
    <div class="bar"><button onclick="window.print()">Descargar / Imprimir PDF</button></div>
    <div class="head">
      <div>
        <div class="brand">INTIFIX<small>${EMISOR.razonSocial}<br/>${EMISOR.direccion}</small></div>
      </div>
      <div class="box">
        <div class="ruc">RUC ${EMISOR.ruc}</div>
        <div class="tipo">${TIPO_LABEL[d.tipo]}</div>
        <div class="cod">${d.codigo}</div>
      </div>
    </div>
    <hr/>
    <div class="meta">
      <div><b>Cliente:</b> ${d.cliente}</div>
      <div><b>Fecha de emisión:</b> ${fmtFecha(d.fecha)}</div>
      <div><b>${d.tipo === "FACTURA" ? "RUC" : "Documento"}:</b> ${d.clienteDoc ?? "—"}</div>
      <div><b>Forma de pago:</b> ${d.metodo ?? "—"}</div>
      ${d.transactionId ? `<div><b>Transacción:</b> ${d.transactionId}</div>` : ""}
    </div>
    <hr/>
    <table>
      ${row("Servicio", d.servicio)}
      ${row("Monto del servicio (neto al técnico)", formatCurrency(d.montoNetoTecnico))}
      ${row("Comisión de intermediación INTIFIX (1%)", formatCurrency(d.comisionBruta))}
      ${row("IGV (18%) sobre la comisión", formatCurrency(d.impuestoTotal))}
      ${row("TOTAL PAGADO", formatCurrency(d.montoTotal), true)}
    </table>
    <p class="note">
      INTIFIX actúa como plataforma de intermediación. El IGV grava únicamente el servicio
      de intermediación (comisión), conforme al modelo de marketplace.
    </p>
    <div class="foot">
      Representación impresa del comprobante electrónico · Generado por INTIFIX
    </div>
  </div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body></html>`
}

/**
 * Abre el comprobante en una ventana nueva (documento real vía Blob URL) y lanza
 * el diálogo de impresión / guardar PDF cuando el contenido ya cargó. Usar un Blob
 * en lugar de document.write evita la página en blanco por imprimir demasiado pronto.
 */
export function descargarComprobante(d: ComprobanteData): boolean {
  const blob = new Blob([comprobanteHtml(d)], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, "_blank", "width=820,height=960")
  if (!w) {
    URL.revokeObjectURL(url)
    return false
  }
  w.focus()
  // El propio documento dispara window.print() en su onload; aquí solo liberamos
  // el Blob URL tras un margen para no cortar la carga.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return true
}
