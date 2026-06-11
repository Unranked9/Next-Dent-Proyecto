export type CondicionSuperficie =
  | 'SANO'
  | 'CARIES'
  | 'RESTAURADO'
  | 'RESTAURADO_R'       // Resina (Buen estado)
  | 'RESTAURADO_AM'      // Amalgama (Buen estado)
  | 'RESTAURADO_IV'      // Ionómero de vidrio (Buen estado)
  | 'RESTAURADO_IM'      // Incrustación Metálica (Buen estado)
  | 'RESTAURADO_IE'      // Incrustación Estética (Buen estado)
  | 'RESTAURADO_DEF_R'   // Resina Defectuosa
  | 'RESTAURADO_DEF_AM'  // Amalgama Defectuosa
  | 'RESTAURADO_DEF_IV'  // Ionómero Defectuoso
  | 'RESTAURADO_DEF_IM'  // Incrustación Metálica Defectuosa
  | 'RESTAURADO_DEF_IE'  // Incrustación Estética Defectuosa
  | 'RESTAURADO_TEMP'    // Restauración Temporal
  | string;

export type CondicionGeneral =
  | 'SANO'
  | 'AUSENTE'
  | 'EXTRAIDO'
  | 'EXTRACCION'
  // ── Tratamientos Pulpares
  | 'ENDODONCIA'
  | 'ENDODONCIA_IND'
  | 'PULPAR_TC'          // Tratamiento de conductos
  | 'PULPAR_PC'          // Pulpectomía
  | 'PULPAR_PP'          // Pulpotomía
  // ── Coronas
  | 'CORONA'
  | 'CORONA_DEF'
  | 'CORONA_TEMP'
  | 'CORONA_CM'          // Corona Metálica
  | 'CORONA_CP'          // Corona Porcelana
  | 'CORONA_CMP'         // Corona Metal Porcelana
  // ── Implantes
  | 'IMPLANTE'
  | 'IMPLANTE_IND'
  // ── Anomalías de Posición y Forma
  | 'MACRODONCIA'
  | 'MICRODONCIA'
  | 'ECTOPICO'
  | 'DISCROMICO'
  | 'IMPACTACION'
  | 'SEMI_IMPACTACION'
  | 'CLAVIJA'
  | 'EXTRUIDO'
  | 'INTRUIDO'
  | 'GIROVERSION'
  | 'MIGRACION'
  // ── Estado Periodontal
  | 'MOVILIDAD_M1'
  | 'MOVILIDAD_M2'
  | 'MOVILIDAD_M3'
  | string;

export interface DienteEstado {
  idRegistro?: number;
  idOdontograma: number;
  numeroFdi: number;
  condicionGeneral: CondicionGeneral;
  estadoSalud?: 'BIEN' | 'MAL';
  estadoClinico?: string;
  supVestibular: CondicionSuperficie;
  supLingual: CondicionSuperficie;
  supMesial: CondicionSuperficie;
  supDistal: CondicionSuperficie;
  supOclusal: CondicionSuperficie;
  siglaRecuadro?: string | null;
  colorRecuadro?: string | null;
  trazoRaiz?: string | null;
  trazoCorona?: string | null;
  trazoExterno?: string | null;
  notas?: string;
}

export type NombreSuperficie =
  | 'supVestibular'
  | 'supLingual'
  | 'supMesial'
  | 'supDistal'
  | 'supOclusal';

export interface OdontogramaMultipieza {
  piezaInicio: number;
  piezaFin: number;
  tipoTratamiento: 'PROTESIS_FIJA' | 'PROTESIS_REMOVIBLE';
  color: 'ROJO' | 'AZUL';
}

export const ESTADO_INICIAL_DIENTE = (
  idOdontograma: number,
  numeroFdi: number
): DienteEstado => ({
  idOdontograma,
  numeroFdi,
  condicionGeneral: 'SANO',
  supVestibular: 'SANO',
  supLingual: 'SANO',
  supMesial: 'SANO',
  supDistal: 'SANO',
  supOclusal: 'SANO',
  siglaRecuadro: null,
  colorRecuadro: null,
  trazoRaiz: null,
  trazoCorona: null,
  trazoExterno: null,
});
