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
