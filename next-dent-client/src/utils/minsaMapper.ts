import type { DienteEstado } from '../types/odontograma';

// ─── Tipo de retorno ──────────────────────────────────────────────────────────

export type MapeoMINSA = Pick<
  DienteEstado,
  'siglaRecuadro' | 'colorRecuadro' | 'trazoRaiz' | 'trazoCorona' | 'trazoExterno'
>;

// Siempre devolvemos los 5 campos para borrar valores arrastrados de estados anteriores.
const VACIO: MapeoMINSA = {
  siglaRecuadro: null,
  colorRecuadro: null,
  trazoRaiz:     null,
  trazoCorona:   null,
  trazoExterno:  null,
};

// ─── Diccionario principal ────────────────────────────────────────────────────

const MAPEO: Record<string, MapeoMINSA> = {
  // ── Restauraciones (norma claves nuevas) ────────────────────────────────────
  AMALGAMA_BUENO:              { ...VACIO, siglaRecuadro: 'AM',  colorRecuadro: 'AZUL' },
  RESINA_BUENO:                { ...VACIO, siglaRecuadro: 'R',   colorRecuadro: 'AZUL' },
  IONOMERO_BUENO:              { ...VACIO, siglaRecuadro: 'IV',  colorRecuadro: 'AZUL' },

  // ── Coronas ─────────────────────────────────────────────────────────────────
  CORONA_METAL_CERAMICA_BUENO: { ...VACIO, siglaRecuadro: 'CMC', colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },
  CORONA_MAL_ESTADO:           { ...VACIO, siglaRecuadro: 'CMC', colorRecuadro: 'ROJO', trazoCorona: 'CIRCULO_ROJO' },

  // ── Endodoncia / raíz ───────────────────────────────────────────────────────
  ENDODONCIA_TRATADA:          { ...VACIO, siglaRecuadro: 'TC',  colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },
  REMANENTE_RADICULAR:         { ...VACIO, trazoRaiz: 'RR_ROJO' },

  // ── Ausencias / extracciones ─────────────────────────────────────────────────
  AUSENTE:                     { ...VACIO, trazoCorona: 'X_AZUL' },
  EXTRACCION_INDICADA:         { ...VACIO, trazoCorona: 'X_ROJA' },

  // ── Implante ─────────────────────────────────────────────────────────────────
  IMPLANTE:                    { ...VACIO, siglaRecuadro: 'IMP', colorRecuadro: 'AZUL' },

  // ── Aliases → claves existentes en CondicionGeneral ─────────────────────────
  EXTRAIDO:                    { ...VACIO, trazoCorona: 'X_AZUL' },
  EXTRACCION:                  { ...VACIO, trazoCorona: 'X_ROJA' },
  ENDODONCIA:                  { ...VACIO, siglaRecuadro: 'TC',  colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },
  ENDODONCIA_IND:              { ...VACIO, colorRecuadro: 'ROJO', trazoRaiz: 'LINEA_VERTICAL_ROJA' },
  CORONA_TEMP:                 { ...VACIO, siglaRecuadro: 'CMC', colorRecuadro: 'ROJO', trazoCorona: 'CIRCULO_ROJO' },
  IMPLANTE_IND:                { ...VACIO, siglaRecuadro: 'IMP', colorRecuadro: 'ROJO' },
  REMANENTE_RAD:               { ...VACIO, trazoRaiz: 'RR_ROJO' },

  // ── Superficies restauradas (anotación a nivel pieza) ─────────────────────
  RESTAURADO_AM:               { ...VACIO, siglaRecuadro: 'AM',  colorRecuadro: 'AZUL' },
  RESTAURADO_R:                { ...VACIO, siglaRecuadro: 'R',   colorRecuadro: 'AZUL' },
  RESTAURADO_IV:               { ...VACIO, siglaRecuadro: 'IV',  colorRecuadro: 'AZUL' },
  RESTAURADO_PC:               { ...VACIO, siglaRecuadro: 'PC',  colorRecuadro: 'AZUL' },
  RESTAURADO_IM:               { ...VACIO, siglaRecuadro: 'IM',  colorRecuadro: 'AZUL' },
  RESTAURADO_IE:               { ...VACIO, siglaRecuadro: 'IE',  colorRecuadro: 'AZUL' },

  // ── Coronas Específicas ──────────────────────────────────────────────────────
  CORONA_CM:  { ...VACIO, siglaRecuadro: 'CM',  colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },
  CORONA_CP:  { ...VACIO, siglaRecuadro: 'CP',  colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },
  CORONA_CMP: { ...VACIO, siglaRecuadro: 'CMP', colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },

  // ── Coronas Estéticas Modernas ────────────────────────────────────────────────
  CORONA_CZ:    { ...VACIO, siglaRecuadro: 'CZ',   colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },  // Zirconio monolítico
  CORONA_ED:    { ...VACIO, siglaRecuadro: 'ED',   colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },  // Disilicato de litio (e.max)
  CORONA_ZP:    { ...VACIO, siglaRecuadro: 'ZP',   colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },  // Zirconio + porcelana estratificada
  CORONA_PFM:   { ...VACIO, siglaRecuadro: 'PFM',  colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },  // Porcelana fusionada a metal
  CORONA_AU:    { ...VACIO, siglaRecuadro: 'AU',   colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },  // Corona de oro (All-metal)
  CORONA_PEEK:  { ...VACIO, siglaRecuadro: 'PK',   colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },  // PEEK (polímero de alto rendimiento)
  CORONA_PMMA:  { ...VACIO, siglaRecuadro: 'PM',   colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },  // PMMA / acrílico provisional CAD-CAM
  CORONA_HPC:   { ...VACIO, siglaRecuadro: 'HPC',  colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },  // Híbrida polímero-cerámica (Vita Enamic, Cerasmart)

  // Versiones en mal estado / indicadas (ROJO)
  CORONA_CZ_MAL:   { ...VACIO, siglaRecuadro: 'CZ',  colorRecuadro: 'ROJO', trazoCorona: 'CIRCULO_ROJO' },
  CORONA_ED_MAL:   { ...VACIO, siglaRecuadro: 'ED',  colorRecuadro: 'ROJO', trazoCorona: 'CIRCULO_ROJO' },
  CORONA_PFM_MAL:  { ...VACIO, siglaRecuadro: 'PFM', colorRecuadro: 'ROJO', trazoCorona: 'CIRCULO_ROJO' },

  // ── Incrustaciones (Inlays / Onlays / Overlays) ───────────────────────────────
  INLAY_CZ:    { ...VACIO, siglaRecuadro: 'ICZ',  colorRecuadro: 'AZUL' },  // Inlay/Onlay zirconio
  INLAY_ED:    { ...VACIO, siglaRecuadro: 'IED',  colorRecuadro: 'AZUL' },  // Inlay/Onlay disilicato
  INLAY_CER:   { ...VACIO, siglaRecuadro: 'CER',  colorRecuadro: 'AZUL' },  // Incrustación ceromero
  INLAY_AU:    { ...VACIO, siglaRecuadro: 'IAU',  colorRecuadro: 'AZUL' },  // Inlay de oro
  ONLAY_CZ:    { ...VACIO, siglaRecuadro: 'OCZ',  colorRecuadro: 'AZUL' },  // Onlay zirconio
  OVERLAY_CZ:  { ...VACIO, siglaRecuadro: 'OVL',  colorRecuadro: 'AZUL' },  // Overlay (cubrimiento cuspídeo total)

  // ── Carillas / Veneers ────────────────────────────────────────────────────────
  CARILLA_ED:    { ...VACIO, siglaRecuadro: 'VED', colorRecuadro: 'AZUL' },  // Carilla disilicato (e.max press/cad)
  CARILLA_CZ:    { ...VACIO, siglaRecuadro: 'VCZ', colorRecuadro: 'AZUL' },  // Carilla zirconio ultrafino
  CARILLA_PC:    { ...VACIO, siglaRecuadro: 'VPC', colorRecuadro: 'AZUL' },  // Carilla porcelana feldespática
  CARILLA_COMP:  { ...VACIO, siglaRecuadro: 'VR',  colorRecuadro: 'AZUL' },  // Carilla de resina compuesta directa

  // ── Restauraciones Estéticas de Resina (por tipo) ────────────────────────────
  RESINA_NHB:    { ...VACIO, siglaRecuadro: 'NH',  colorRecuadro: 'AZUL' },  // Resina nanohíbrida
  RESINA_NBF:    { ...VACIO, siglaRecuadro: 'NF',  colorRecuadro: 'AZUL' },  // Resina nanorrelleno (bulk fill)
  RESINA_BLK:    { ...VACIO, siglaRecuadro: 'BF',  colorRecuadro: 'AZUL' },  // Resina bulk-fill
  RESINA_FLOW:   { ...VACIO, siglaRecuadro: 'RF',  colorRecuadro: 'AZUL' },  // Resina fluida (liner)

  // ── Implantes (por tipo de conexión / material) ───────────────────────────────
  IMPLANTE_TI:    { ...VACIO, siglaRecuadro: 'ITI', colorRecuadro: 'AZUL' },  // Implante titanio (conexión interna)
  IMPLANTE_TE:    { ...VACIO, siglaRecuadro: 'ITE', colorRecuadro: 'AZUL' },  // Implante titanio (conexión externa hex)
  IMPLANTE_ZR:    { ...VACIO, siglaRecuadro: 'IZR', colorRecuadro: 'AZUL' },  // Implante zirconio
  IMPLANTE_MINI:  { ...VACIO, siglaRecuadro: 'IMN', colorRecuadro: 'AZUL' },  // Mini-implante
  // Implante indicado (ROJO)
  IMPLANTE_TI_IND: { ...VACIO, siglaRecuadro: 'ITI', colorRecuadro: 'ROJO' },
  IMPLANTE_ZR_IND: { ...VACIO, siglaRecuadro: 'IZR', colorRecuadro: 'ROJO' },

  // ── Prótesis Fija (Puentes) ───────────────────────────────────────────────────
  PUENTE_CZ:    { ...VACIO, siglaRecuadro: 'PCZ', colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },
  PUENTE_PFM:   { ...VACIO, siglaRecuadro: 'PPF', colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' },
  PUENTE_MAL:   { ...VACIO, siglaRecuadro: 'PF',  colorRecuadro: 'ROJO', trazoCorona: 'CIRCULO_ROJO' },

  // ── Blanqueamiento ────────────────────────────────────────────────────────────
  BLANQUEAMIENTO: { ...VACIO, siglaRecuadro: 'BL', colorRecuadro: 'AZUL' },

  // ── Sellantes ────────────────────────────────────────────────────────────────
  SELLANTE:      { ...VACIO, siglaRecuadro: 'SE', colorRecuadro: 'AZUL' },
  SELLANTE_DEF:  { ...VACIO, siglaRecuadro: 'SE', colorRecuadro: 'ROJO' },

  // ── Tratamientos Periodontales ───────────────────────────────────────────────
  PERIO_RAR:    { ...VACIO, siglaRecuadro: 'RAR', colorRecuadro: 'AZUL' },  // Raspado y alisado radicular
  PERIO_GIN:    { ...VACIO, siglaRecuadro: 'GIN', colorRecuadro: 'ROJO' },  // Gingivectomía
  PERIO_CIR:    { ...VACIO, siglaRecuadro: 'CIR', colorRecuadro: 'AZUL' },  // Cirugía periodontal (colgajo)

  // ── Tratamientos Pulpares Adicionales ───────────────────────────────────────
  PULPAR_PD:    { ...VACIO, siglaRecuadro: 'PD',  colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },  // Pulpotomía decidua
  PULPAR_APEX:  { ...VACIO, siglaRecuadro: 'APX', colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },  // Apexificación
  RETRATAMIENTO:{ ...VACIO, siglaRecuadro: 'RT',  colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },  // Retratamiento endodóntico
  CIRUGIA_APICAL:{ ...VACIO, siglaRecuadro: 'CA', colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },  // Cirugía apical (apicectomía)

  // ── Tratamientos Pulpares ───────────────────────────────────────────────────
  PULPAR_TC: { ...VACIO, siglaRecuadro: 'TC', colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },
  PULPAR_PC: { ...VACIO, siglaRecuadro: 'PC', colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },
  PULPAR_PP: { ...VACIO, siglaRecuadro: 'PP', colorRecuadro: 'AZUL', trazoRaiz: 'LINEA_VERTICAL_AZUL' },

  // ── Anomalías de Forma / Estructura (Siglas en Recuadro) ────────────────────
  MACRODONCIA:      { ...VACIO, siglaRecuadro: 'MAC', colorRecuadro: 'AZUL' },
  MICRODONCIA:      { ...VACIO, siglaRecuadro: 'MIC', colorRecuadro: 'AZUL' },
  DISCROMICO:       { ...VACIO, siglaRecuadro: 'DIS', colorRecuadro: 'AZUL' },
  ECTOPICO:         { ...VACIO, siglaRecuadro: 'E',   colorRecuadro: 'AZUL' },
  IMPACTACION:      { ...VACIO, siglaRecuadro: 'I',   colorRecuadro: 'AZUL' },
  SEMI_IMPACTACION: { ...VACIO, siglaRecuadro: 'SI',  colorRecuadro: 'AZUL' },

  // ── Anomalías Periodontales (Movilidad) ─────────────────────────────────────
  MOVILIDAD_M1: { ...VACIO, siglaRecuadro: 'M1', colorRecuadro: 'AZUL' },
  MOVILIDAD_M2: { ...VACIO, siglaRecuadro: 'M2', colorRecuadro: 'AZUL' },
  MOVILIDAD_M3: { ...VACIO, siglaRecuadro: 'M3', colorRecuadro: 'AZUL' },

  // ── Anomalías de Posición (Vectores Gráficos) ───────────────────────────────
  CLAVIJA:     { ...VACIO, trazoCorona: 'TRIANGULO_AZUL' },
  EXTRUIDO:    { ...VACIO, trazoCorona: 'FLECHA_ARRIBA_AZUL' },
  INTRUIDO:    { ...VACIO, trazoCorona: 'FLECHA_ABAJO_AZUL' },
  GIROVERSION: { ...VACIO, trazoCorona: 'FLECHA_CURVA_AZUL' },
  MIGRACION:   { ...VACIO, trazoCorona: 'FLECHA_HORIZONTAL_AZUL' },

  // ── Restauraciones Defectuosas ───────────────────────────────────────────────
  RESTAURADO_DEF_R:  { ...VACIO, siglaRecuadro: 'R',  colorRecuadro: 'ROJO' },
  RESTAURADO_DEF_AM: { ...VACIO, siglaRecuadro: 'AM', colorRecuadro: 'ROJO' },
  RESTAURADO_DEF_IV: { ...VACIO, siglaRecuadro: 'IV', colorRecuadro: 'ROJO' },
  RESTAURADO_DEF_IM: { ...VACIO, siglaRecuadro: 'IM', colorRecuadro: 'ROJO' },
  RESTAURADO_DEF_IE: { ...VACIO, siglaRecuadro: 'IE', colorRecuadro: 'ROJO' },
  RESTAURADO_TEMP:   { ...VACIO, colorRecuadro: 'ROJO' },
};

// ─── Factory principal ────────────────────────────────────────────────────────

/**
 * Devuelve los 5 campos visuales MINSA para el diagnóstico indicado.
 *
 * CORONA_DEF es el único caso bifurcado: estadoSalud 'MAL' → simbología roja.
 * Todos los campos no aplicables se devuelven como null para no arrastrar
 * datos de un diagnóstico previo.
 */
export function obtenerMapeoMINSA(
  diagnostico: string,
  estadoSalud?: 'BIEN' | 'MAL',
): MapeoMINSA {
  if (diagnostico === 'CORONA_DEF') {
    return estadoSalud === 'MAL'
      ? { ...VACIO, siglaRecuadro: 'CMC', colorRecuadro: 'ROJO', trazoCorona: 'CIRCULO_ROJO' }
      : { ...VACIO, siglaRecuadro: 'CMC', colorRecuadro: 'AZUL', trazoCorona: 'CIRCULO_AZUL' };
  }

  return MAPEO[diagnostico] ?? VACIO;
}
