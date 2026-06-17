import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CLINICA } from '../config/clinica';
import type { Paciente } from '../types/paciente';
import type { Presupuesto } from '../types/presupuesto';
import type { Evolucion } from '../types/hce';
import type { Tarifario } from '../types/tarifario';
import type { Doctor } from '../types/doctor';

// ── Tipos de entrada ──────────────────────────────────────────────────────────

interface FichaData {
  paciente: Paciente;
  cicloFecha: string;
  presupuestos: Presupuesto[];
  evoluciones: Evolucion[];
  tarifas: Tarifario[];
  doctor: Doctor | null;
  anamnesis?: {
    motivoConsulta?: string;
    riesgosDetectados?: string;
    resumenCuestionario?: string;
  } | null;
}

// ── Colores ───────────────────────────────────────────────────────────────────

const INDIGO   = [79, 70, 229]   as [number, number, number];
const SLATE50  = [248, 250, 252] as [number, number, number];
const SLATE700 = [51, 65, 85]    as [number, number, number];

// ── Helper: capturar el div del odontograma → PNG base64 ────────────────────
// El odontograma es un div con múltiples <DienteSVG /> hijos — un solo SVG
// solo capturaría el primer diente. html2canvas renderiza el árbol completo.

async function capturarOdontogramaComoImagen(): Promise<string | null> {
  const contenedor = document.getElementById('mapa-dientes-container');
  if (!contenedor) return null;

  try {
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(contenedor, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: false,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: contenedor.scrollWidth,
      windowHeight: contenedor.scrollHeight,
      // Tailwind v4 usa oklch() que html2canvas no entiende — inyectar fallbacks hex.
      onclone: (_: Document, el: HTMLElement) => {
        const style = document.createElement('style');
        style.textContent = `
          .fill-red-500    { fill: #ef4444 !important; }
          .fill-blue-500   { fill: #3b82f6 !important; }
          .fill-blue-400   { fill: #60a5fa !important; }
          .fill-yellow-400 { fill: #facc15 !important; }
          .fill-slate-200  { fill: #e2e8f0 !important; }
          .fill-slate-300  { fill: #cbd5e1 !important; }
          .fill-white      { fill: #ffffff !important; }
          .fill-none       { fill: none    !important; }
          .stroke-red-500   { stroke: #ef4444 !important; }
          .stroke-blue-500  { stroke: #3b82f6 !important; }
          .stroke-slate-300 { stroke: #cbd5e1 !important; }
          .stroke-slate-400 { stroke: #94a3b8 !important; }
          .bg-red-50   { background-color: #fef2f2 !important; }
          .bg-blue-50  { background-color: #eff6ff !important; }
          .bg-white    { background-color: #ffffff !important; }
          .text-red-600   { color: #dc2626 !important; }
          .text-blue-600  { color: #2563eb !important; }
          .text-slate-300 { color: #cbd5e1 !important; }
          .border-slate-200 { border-color: #e2e8f0 !important; }
          .bg-slate-200     { background-color: #e2e8f0 !important; }
          .bg-emerald-500   { background-color: #10b981 !important; }
        `;
        el.appendChild(style);

        el.querySelectorAll('svg path, svg rect, svg circle, svg line, svg polygon').forEach((node) => {
          const svgEl = node as SVGElement;
          const computed = window.getComputedStyle(svgEl);
          const fill = computed.fill;
          if (fill && fill !== 'none' && !fill.startsWith('oklch')) {
            svgEl.setAttribute('fill', fill);
          } else if (fill.startsWith('oklch')) {
            svgEl.setAttribute('fill', 'none');
          }
          const stroke = computed.stroke;
          if (stroke && stroke !== 'none' && !stroke.startsWith('oklch')) {
            svgEl.setAttribute('stroke', stroke);
          }
        });
      },
    });

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error al capturar odontograma:', err);
    return null;
  }
}

// ── Función principal ─────────────────────────────────────────────────────────

export async function exportarFichaPdf(data: FichaData): Promise<void> {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W    = doc.internal.pageSize.getWidth();
  const margen = 18;
  let y = margen;

  const nombreTratamiento = (idTarifa: number) =>
    data.tarifas.find((t) => t.idTarifa === idTarifa)?.nombre ?? `Tratamiento #${idTarifa}`;

  const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ── ENCABEZADO ─────────────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INDIGO);
  doc.text(CLINICA.nombre.toUpperCase(), margen, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE700);
  doc.text('HISTORIA CLÍNICA ODONTOLÓGICA', W - margen, y, { align: 'right' });

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${CLINICA.direccion}  ·  Tel: ${CLINICA.telefono}  ·  RUC: ${CLINICA.ruc}`, margen, y);
  doc.text(`Generado el ${fechaHoy}`, W - margen, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(...INDIGO);
  doc.setLineWidth(0.6);
  doc.line(margen, y, W - margen, y);
  y += 8;

  // ── DATOS DEL PACIENTE ──────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE700);
  doc.text('DATOS DEL PACIENTE', margen, y);
  y += 5;

  const col1 = margen;
  const col2 = W / 2 + 5;

  const campo = (label: string, valor: string, x: number, cy: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, cy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE700);
    doc.text(valor || '—', x, cy + 4);
  };

  campo('Nombre completo', `${data.paciente.nombre} ${data.paciente.apellido}`, col1, y);
  campo('DNI', data.paciente.dni, col2, y);
  y += 10;
  campo('Teléfono', data.paciente.telefono || '—', col1, y);
  campo('Correo', data.paciente.correo || '—', col2, y);
  y += 10;
  campo('Fecha de nacimiento', data.paciente.fechaNacimiento || '—', col1, y);
  campo('Ciclo clínico', `Iniciado el ${data.cicloFecha}`, col2, y);
  y += 10;

  if (data.doctor) {
    campo(
      'Tratante',
      `Dr. ${data.doctor.nombre} ${data.doctor.apellido}${data.doctor.cmp ? ` · CMP: ${data.doctor.cmp}` : ''}`,
      col1, y,
    );
    y += 10;
  }

  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margen, y, W - margen, y);
  y += 8;

  // ── ANAMNESIS ───────────────────────────────────────────────────────────────

  const { anamnesis } = data;
  const hayAnamnesis =
    anamnesis &&
    (anamnesis.motivoConsulta?.trim() ||
     anamnesis.riesgosDetectados?.trim() ||
     anamnesis.resumenCuestionario?.trim());

  if (hayAnamnesis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE700);
    doc.text('ANAMNESIS', margen, y);
    y += 5;

    const bloques = [
      { label: 'Motivo de consulta',       valor: anamnesis!.motivoConsulta },
      { label: 'Resumen del cuestionario', valor: anamnesis!.resumenCuestionario },
      { label: 'Riesgos detectados',       valor: anamnesis!.riesgosDetectados },
    ].filter((b) => b.valor?.trim());

    for (const bloque of bloques) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...INDIGO);
      doc.text(bloque.label!.toUpperCase(), margen, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...SLATE700);
      const lineas = doc.splitTextToSize(bloque.valor!, W - margen * 2);
      doc.text(lineas, margen, y);
      y += lineas.length * 4.5 + 4;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margen, y, W - margen, y);
    y += 8;
  }

  // ── ODONTOGRAMA ─────────────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE700);
  doc.text('DIAGNÓSTICO ODONTOLÓGICO', margen, y);
  y += 5;

  const odontogramaImg = await capturarOdontogramaComoImagen();

  if (odontogramaImg) {
    const anchoUtil = W - margen * 2;
    const altoPdf   = anchoUtil / 2.8;

    if (y + altoPdf > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margen;
    }

    doc.addImage(odontogramaImg, 'PNG', margen, y, anchoUtil, altoPdf);
    y += altoPdf + 6;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'El odontograma interactivo está disponible en el sistema digital Next Dent.',
      margen, y,
    );
    y += 8;
  }

  // ── HALLAZGOS (resumen de piezas planificadas) ──────────────────────────────

  const detallesConFdi = data.presupuestos
    .flatMap((p) => p.detalles ?? [])
    .filter((d) => d.estado !== 'ANULADO' && d.numeroFdi > 0);

  if (detallesConFdi.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE700);
    doc.text('Resumen de piezas con tratamiento planificado:', margen, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['FDI', 'Tratamiento', 'Estado']],
      body: detallesConFdi.map((d) => [
        String(d.numeroFdi),
        nombreTratamiento(d.idTarifa),
        d.estado ?? 'PENDIENTE',
      ]),
      margin: { left: margen, right: margen },
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: SLATE700 },
      alternateRowStyles: { fillColor: SLATE50 },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30, halign: 'center' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margen, y, W - margen, y);
  y += 8;

  // ── PRESUPUESTOS ────────────────────────────────────────────────────────────

  if (data.presupuestos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE700);
    doc.text('PLAN DE TRATAMIENTO / PRESUPUESTO', margen, y);
    y += 5;

    for (const p of data.presupuestos) {
      const detallesActivos = (p.detalles ?? []).filter((d) => d.estado !== 'ANULADO');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...INDIGO);
      doc.text(
        `Presupuesto #${p.idPresupuesto}  ·  ${p.estado}  ·  Fecha: ${p.fechaCreacion}`,
        margen, y,
      );
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['FDI', 'Tratamiento', 'Precio', 'Estado']],
        body: detallesActivos.map((d) => [
          d.numeroFdi > 0 ? String(d.numeroFdi) : '—',
          nombreTratamiento(d.idTarifa),
          fmt(d.precioUnitario),
          d.estado ?? 'PENDIENTE',
        ]),
        margin: { left: margen, right: margen },
        headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: SLATE700 },
        alternateRowStyles: { fillColor: SLATE50 },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 28, halign: 'right' },
          3: { cellWidth: 26, halign: 'center' },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 3;

      const totalActivos = detallesActivos.reduce((s, d) => s + d.precioUnitario, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Total:', W - margen - 28, y, { align: 'left' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...INDIGO);
      doc.text(fmt(totalActivos), W - margen, y, { align: 'right' });
      y += 10;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margen, y, W - margen, y);
    y += 8;
  }

  // ── EVOLUCIONES ─────────────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE700);
  doc.text('EVOLUCIONES CLÍNICAS', margen, y);
  y += 5;

  if (data.evoluciones.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sin evoluciones registradas en este ciclo.', margen, y);
    y += 8;
  } else {
    const evols = [...data.evoluciones].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Tratamiento', 'Pieza', 'Doctor', 'Nota clínica']],
      body: evols.map((ev) => [
        ev.fecha ?? '—',
        ev.idTarifa ? nombreTratamiento(ev.idTarifa) : 'No especificado',
        ev.numeroFdi && ev.numeroFdi > 0 ? String(ev.numeroFdi) : '—',
        `Dr. ${ev.nombreDoctor ?? 'No registrado'}`,
        ev.descripcion
          ? ev.descripcion.length > 90
            ? ev.descripcion.slice(0, 90) + '…'
            : ev.descripcion
          : 'Sin nota',
      ]),
      margin: { left: margen, right: margen },
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: SLATE700 },
      alternateRowStyles: { fillColor: SLATE50 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 38 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 34 },
        4: { cellWidth: 'auto' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── PIE DE PÁGINA ────────────────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${CLINICA.nombre} · Historia Clínica Confidencial · Generado el ${fechaHoy}`,
      margen,
      pageH - 8,
    );
    doc.text(`Página ${i} de ${totalPages}`, W - margen, pageH - 8, { align: 'right' });
  }

  // ── GUARDAR ───────────────────────────────────────────────────────────────────

  const nombreArchivo = `ficha_${data.paciente.apellido}_${data.paciente.nombre}_ciclo_${data.cicloFecha}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .concat('.pdf');

  doc.save(nombreArchivo);
}
