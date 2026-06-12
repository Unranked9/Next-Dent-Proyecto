export type CondicionSuperficie =
  | 'SANO'
  | 'CARIES'
  | 'RESTAURADO'
  | 'RESTAURADO_R'    // Resina
  | 'RESTAURADO_AM'   // Amalgama
  | 'RESTAURADO_IV'   // Ionómero de vidrio
  | 'RESTAURADO_PC'   // Porcelana
  | string;

export type CondicionGeneral =
  | 'SANO'
  | 'AUSENTE'
  | 'EXTRAIDO'
  | 'EXTRACCION'
  | 'ENDODONCIA'
  | 'ENDODONCIA_IND'  // indicada → línea roja
  | 'CORONA'
  | 'CORONA_DEF'
  | 'CORONA_TEMP'
  | 'IMPLANTE'
  | 'IMPLANTE_IND'    // indicado → IMP rojo
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
export type TipoMultipieza = 
  | 'PROTESIS_FIJA' 
  | 'PROTESIS_REMOVIBLE' 
  | 'PROTESIS_TOTAL' 
  | 'EDENTULO_TOTAL' 
  | 'ORTODONCIA_FIJA' 
  | 'ORTODONCIA_REMOVIBLE' 
  | 'DIASTEMA' 
  | 'FUSION' 
  | 'TRANSPOSICION';

export interface OdontogramaMultipieza {
  idMultipieza?: number;
  idOdontograma: number;
  tipoTratamiento: TipoMultipieza;
  color: 'AZUL' | 'ROJO';
  piezaInicio: number;
  piezaFin: number;
  notas?: string; // Para el panel inferior de "Especificaciones" que exige la norma
}