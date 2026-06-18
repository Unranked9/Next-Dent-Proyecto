import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CLINICA } from '../config/clinica';
import type { Presupuesto } from '../types/presupuesto';
import type { Paciente } from '../types/paciente';
import type { Tarifario } from '../types/tarifario';
import type { Doctor } from '../types/doctor';

interface PresupuestoPdfOptions {
  presupuesto: Presupuesto;
  paciente: Paciente;
  tarifas: Tarifario[];
  doctor: Doctor | null;
}

const INDIGO   = [79, 70, 229]   as [number, number, number];
const SLATE50  = [248, 250, 252] as [number, number, number];
const SLATE700 = [51, 65, 85]    as [number, number, number];

export function exportarPresupuestoPdf({
  presupuesto,
  paciente,
  tarifas,
  doctor,
}: PresupuestoPdfOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margen = 18;
  let y = margen;

  const nombreTratamiento = (idTarifa: number) =>
    tarifas.find((t) => t.idTarifa === idTarifa)?.nombre ?? `Tratamiento #${idTarifa}`;

  const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ── ENCABEZADO ────────────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...INDIGO);
  doc.text(CLINICA.nombre.toUpperCase(), margen, y);

  doc.setFontSize(11);
  doc.setTextColor(...SLATE700);
  doc.text(`PRESUPUESTO #${presupuesto.idPresupuesto}`, W - margen, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  // doc.text(`${CLINICA.direccion}`, margen, y);
  doc.text(`Fecha: ${fechaHoy}`, W - margen, y, { align: 'right' });

  // y += 4;
  // doc.text(`Tel: ${CLINICA.telefono}  ·  ${CLINICA.email}`, margen, y);

  // if (CLINICA.ruc) {
  //   y += 4;
  //   doc.text(`RUC: ${CLINICA.ruc}`, margen, y);
  // }

  y += 6;

  doc.setDrawColor(...INDIGO);
  doc.setLineWidth(0.6);
  doc.line(margen, y, W - margen, y);
  y += 8;

  // ── DATOS DEL PACIENTE ────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE700);
  doc.text('DATOS DEL PACIENTE', margen, y);
  y += 5;

  const col1x = margen;
  const col2x = W / 2 + 5;

  const campo = (label: string, valor: string, x: number, cy: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, cy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE700);
    doc.text(valor, x, cy + 4);
  };

  campo('Nombre completo', `${paciente.nombre} ${paciente.apellido}`, col1x, y);
  campo('DNI', paciente.dni, col2x, y);
  y += 10;
  campo('Teléfono', paciente.telefono || '—', col1x, y);
  campo('Correo', paciente.correo || '—', col2x, y);
  y += 10;

  if (paciente.direccion) {
    campo('Dirección', paciente.direccion, col1x, y);
    y += 10;
  }

  // ── DOCTOR ────────────────────────────────────────────────────────────────

  if (doctor) {
    campo(
      'Tratante',
      `Dr. ${doctor.nombre} ${doctor.apellido}${doctor.especialidad ? ` — ${doctor.especialidad}` : ''}${doctor.cmp ? ` · CMP: ${doctor.cmp}` : ''}`,
      col1x,
      y,
    );
    y += 10;
  }

  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margen, y, W - margen, y);
  y += 8;

  // ── TABLA DE TRATAMIENTOS ────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE700);
  doc.text('PLAN DE TRATAMIENTO', margen, y);
  y += 4;

  const detallesActivos = (presupuesto.detalles ?? []).filter(
    (d) => d.estado !== 'ANULADO',
  );

  const rows = detallesActivos.map((d) => [
    d.numeroFdi > 0 ? String(d.numeroFdi) : '—',
    nombreTratamiento(d.idTarifa),
    tarifas.find((t) => t.idTarifa === d.idTarifa)?.categoria ?? '—',
    d.estado ?? 'PENDIENTE',
    fmt(d.precioUnitario),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['FDI', 'Tratamiento', 'Categoría', 'Estado', 'Precio']],
    body: rows,
    margin: { left: margen, right: margen },
    headStyles: {
      fillColor: INDIGO,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: SLATE700,
    },
    alternateRowStyles: { fillColor: SLATE50 },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // ── TOTAL ────────────────────────────────────────────────────────────────

  const totalActivos = detallesActivos.reduce((s, d) => s + d.precioUnitario, 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Total tratamientos activos:', W - margen, finalY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INDIGO);
  doc.text(fmt(totalActivos), W - margen, finalY + 8, { align: 'right' });

  const anulados = (presupuesto.detalles ?? []).filter((d) => d.estado === 'ANULADO');
  if (anulados.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `* ${anulados.length} tratamiento(s) anulado(s) no incluido(s) en el total.`,
      margen,
      finalY,
    );
  }

  // ── VALIDEZ Y CONDICIONES ─────────────────────────────────────────────────

  const yCondiciones = finalY + 22;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margen, yCondiciones - 4, W - margen, yCondiciones - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE700);
  doc.text('CONDICIONES', margen, yCondiciones);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const condiciones = [
    '· Este presupuesto tiene una validez de 30 días a partir de la fecha de emisión.',
    '· Los precios indicados están en Soles (S/) e incluyen el procedimiento clínico.',
    '· El presupuesto puede variar según el diagnóstico definitivo al iniciar el tratamiento.',
  ];
  condiciones.forEach((line, i) => {
    doc.text(line, margen, yCondiciones + 5 + i * 4.5);
  });

  // ── FIRMA ────────────────────────────────────────────────────────────────

  const yFirma = yCondiciones + 32;
  const xFirma = W - margen - 50;

  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.4);
  doc.line(xFirma, yFirma, W - margen, yFirma);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  if (doctor) {
    doc.text(`Dr. ${doctor.nombre} ${doctor.apellido}`, xFirma + 25, yFirma + 4, { align: 'center' });
    if (doctor.cmp) {
      doc.text(`CMP: ${doctor.cmp}`, xFirma + 25, yFirma + 8, { align: 'center' });
    }
  } else {
    doc.text('Firma del tratante', xFirma + 25, yFirma + 4, { align: 'center' });
  }

  // ── PIE DE PÁGINA ────────────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`${CLINICA.nombre} · Documento generado el ${fechaHoy}`, margen, pageH - 8);
    doc.text(`Página ${i} de ${totalPages}`, W - margen, pageH - 8, { align: 'right' });
  }

  // ── GUARDAR ───────────────────────────────────────────────────────────────

  const nombreArchivo = `presupuesto_${presupuesto.idPresupuesto}_${paciente.apellido}_${paciente.nombre}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .concat('.pdf');

  doc.save(nombreArchivo);
}
