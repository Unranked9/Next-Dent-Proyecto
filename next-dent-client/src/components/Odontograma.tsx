import { useEffect, useRef, useState } from 'react';
import DienteSVG from './DienteSVG';
import CapaMultipieza from './CapaMultipieza';
import * as odontogramaService from '../services/odontogramaService';
import { ESTADO_INICIAL_DIENTE } from '../types/odontograma';
import type {
  DienteEstado,
  NombreSuperficie,
  CondicionGeneral,
  CondicionSuperficie,
  OdontogramaMultipieza,
} from '../types/odontograma';
import { obtenerMapeoMINSA } from '../utils/minsaMapper';

// ─── FDI rows ─────────────────────────────────────────────────────────────────

const ADULT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const CHILD_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const CHILD_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];
const ADULT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const ALL_FDI = [...ADULT_UPPER, ...CHILD_UPPER, ...CHILD_LOWER, ...ADULT_LOWER];

const SUPERFICIES: NombreSuperficie[] = [
  'supVestibular',
  'supLingual',
  'supMesial',
  'supDistal',
  'supOclusal',
];

// ─── treatments that carry an independent health-state selector ───────────────

const REQUIERE_ESTADO = new Set(['CORONA_DEF', 'ENDODONCIA', 'IMPLANTE']);

function getLabelHallazgo(diagnostico: string, estadoSalud?: 'BIEN' | 'MAL'): string {
  const base = LABEL_DIAGNOSTICO[diagnostico] ?? diagnostico;
  if (REQUIERE_ESTADO.has(diagnostico) && estadoSalud === 'MAL') return `${base} (Mal Estado)`;
  return base;
}

// ─── labels & config ──────────────────────────────────────────────────────────

const INICIAL_SUPERFICIE: Record<NombreSuperficie | 'general', string> = {
  supVestibular: 'V',
  supLingual:    'L',
  supMesial:     'M',
  supDistal:     'D',
  supOclusal:    'O',
  general:       'General',
};

const LABEL_ZONA: Record<string, string> = {
  vestibular: 'Vestibular',
  lingual:    'Lingual',
  mesial:     'Mesial',
  distal:     'Distal',
  oclusal:    'Oclusal',
  general:    'General',
};

const LABEL_DIAGNOSTICO: Record<string, string> = {
  SANO:            'Sano',
  CARIES:          'Caries',
  RESTAURADO:      'Restauración',
  RESTAURADO_R:    'Resina (R)',
  RESTAURADO_AM:   'Amalgama (AM)',
  RESTAURADO_IV:   'Ionómero (IV)',
  RESTAURADO_PC:   'Porcelana (PC)',
  RESTAURADO_DEF:  'Restauración Defectuosa',
  SELLANTE:        'Sellante',
  AUSENTE:         'Ausente',
  EXTRACCION:      'Extracción Indicada',
  EXTRAIDO:        'Extraído',
  ENDODONCIA:      'Endodoncia',
  ENDODONCIA_IND:  'Endodoncia Indicada',
  CORONA:          'Corona',
  CORONA_DEF:      'Corona Definitiva',
  CORONA_TEMP:     'Corona Mal Estado',
  IMPLANTE:        'Implante',
  IMPLANTE_IND:    'Implante Indicado',
  REMANENTE_RAD:   'Remanente Radicular',
};

function getBadge(diag: string): string {
  if (diag.startsWith('RESTAURADO')) return 'bg-blue-50 text-blue-700 border border-blue-200';
  const map: Record<string, string> = {
    CARIES:         'bg-red-50 text-red-700 border border-red-200',
    AUSENTE:        'bg-slate-100 text-slate-600 border border-slate-300',
    EXTRACCION:     'bg-red-100 text-red-800 border border-red-300',
    EXTRAIDO:       'bg-red-100 text-red-800 border border-red-300',
    ENDODONCIA:     'bg-purple-50 text-purple-700 border border-purple-200',
    ENDODONCIA_IND: 'bg-red-50 text-red-700 border border-red-200',
    CORONA:         'bg-amber-50 text-amber-700 border border-amber-200',
    CORONA_DEF:     'bg-amber-50 text-amber-700 border border-amber-200',
    CORONA_TEMP:    'bg-orange-50 text-orange-700 border border-orange-200',
    IMPLANTE:       'bg-teal-50 text-teal-700 border border-teal-200',
    IMPLANTE_IND:   'bg-red-50 text-red-700 border border-red-200',
  };
  return map[diag] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
}


// ─── zona → NombreSuperficie map ──────────────────────────────────────────────

const ZONA_TO_SUP: Record<string, NombreSuperficie | 'general'> = {
  vestibular: 'supVestibular',
  lingual:    'supLingual',
  mesial:     'supMesial',
  distal:     'supDistal',
  oclusal:    'supOclusal',
  general:    'general',
};

// ─── Smart UI — Diagnósticos MINSA agrupados en acordeones ──────────────────

interface GrupoDiagnostico {
  titulo: string;
  items: { label: string; value: string; color: 'red' | 'blue' }[];
  abiertoPorDefecto?: boolean;
}

const GRUPOS_CARA: GrupoDiagnostico[] = [
  {
    titulo: 'Patologías',
    abiertoPorDefecto: true,
    items: [
      { label: 'Caries',            value: 'CARIES',           color: 'red' },
      { label: 'Resina Defect.',    value: 'RESTAURADO_DEF_R', color: 'red' },
      { label: 'Amalgama Def.',     value: 'RESTAURADO_DEF_AM',color: 'red' },
      { label: 'Ionómero Def.',     value: 'RESTAURADO_DEF_IV',color: 'red' },
      { label: 'Rest. Temporal',    value: 'RESTAURADO_TEMP',  color: 'red' },
    ],
  },
  {
    titulo: 'Tratamientos (Buen Estado)',
    abiertoPorDefecto: true,
    items: [
      { label: 'Sano / Limpiar',    value: 'SANO',          color: 'blue' },
      { label: 'Sellante',          value: 'SELLANTE',      color: 'blue' },
      { label: 'Resina (R)',        value: 'RESTAURADO_R',  color: 'blue' },
      { label: 'Amalgama (AM)',     value: 'RESTAURADO_AM', color: 'blue' },
      { label: 'Ionómero (IV)',     value: 'RESTAURADO_IV', color: 'blue' },
      { label: 'Incrust. Estética', value: 'RESTAURADO_IE', color: 'blue' },
      { label: 'Incrust. Metálica', value: 'RESTAURADO_IM', color: 'blue' },
    ],
  },
];

const GRUPOS_PIEZA: GrupoDiagnostico[] = [
  {
    titulo: 'Ausencias y Extracciones',
    abiertoPorDefecto: true,
    items: [
      { label: 'Ausente / Extraído',      value: 'AUSENTE',             color: 'blue' },
      { label: 'Extracción Indicada',     value: 'EXTRACCION_INDICADA', color: 'red'  },
      { label: 'Remanente Radicular',     value: 'REMANENTE_RAD',       color: 'red'  },
    ],
  },
  {
    titulo: 'Coronas Tradicionales',
    abiertoPorDefecto: true,
    items: [
      { label: 'Metal-Cerámica (CMC)',    value: 'CORONA_CMP',          color: 'blue' },
      { label: 'Metálica (CM)',           value: 'CORONA_CM',           color: 'blue' },
      { label: 'Porcelana Pura (CP)',     value: 'CORONA_CP',           color: 'blue' },
      { label: 'Corona Defect./Temp.',    value: 'CORONA_TEMP',         color: 'red'  },
    ],
  },
  {
    titulo: 'Coronas Estéticas Modernas',
    abiertoPorDefecto: true,
    items: [
      { label: 'Zirconio Monolítico (CZ)',    value: 'CORONA_CZ',   color: 'blue' },
      { label: 'Disilicato e.max (ED)',        value: 'CORONA_ED',   color: 'blue' },
      { label: 'Zirconio + Porcelana (ZP)',    value: 'CORONA_ZP',   color: 'blue' },
      { label: 'Porcelana Metal (PFM)',        value: 'CORONA_PFM',  color: 'blue' },
      { label: 'Híbrida Polímero-Cer. (HPC)', value: 'CORONA_HPC',  color: 'blue' },
      { label: 'PEEK (PK)',                    value: 'CORONA_PEEK', color: 'blue' },
      { label: 'Provisional CAD-CAM (PM)',     value: 'CORONA_PMMA', color: 'blue' },
      { label: 'Oro Colado (AU)',              value: 'CORONA_AU',   color: 'blue' },
      { label: 'Corona CZ/ED — Mal Estado',   value: 'CORONA_CZ_MAL', color: 'red' },
      { label: 'Corona PFM — Mal Estado',     value: 'CORONA_PFM_MAL', color: 'red' },
    ],
  },
  {
    titulo: 'Inlays / Onlays / Overlays',
    abiertoPorDefecto: false,
    items: [
      { label: 'Inlay Zirconio (ICZ)',     value: 'INLAY_CZ',    color: 'blue' },
      { label: 'Inlay Disilicato (IED)',   value: 'INLAY_ED',    color: 'blue' },
      { label: 'Incrustación Ceromero',    value: 'INLAY_CER',   color: 'blue' },
      { label: 'Inlay Oro (IAU)',          value: 'INLAY_AU',    color: 'blue' },
      { label: 'Onlay Zirconio (OCZ)',     value: 'ONLAY_CZ',    color: 'blue' },
      { label: 'Overlay (OVL)',            value: 'OVERLAY_CZ',  color: 'blue' },
    ],
  },
  {
    titulo: 'Carillas / Veneers',
    abiertoPorDefecto: false,
    items: [
      { label: 'Carilla Disilicato (VED)', value: 'CARILLA_ED',   color: 'blue' },
      { label: 'Carilla Zirconio (VCZ)',   value: 'CARILLA_CZ',   color: 'blue' },
      { label: 'Carilla Porcelana (VPC)',  value: 'CARILLA_PC',   color: 'blue' },
      { label: 'Carilla Resina (VR)',      value: 'CARILLA_COMP', color: 'blue' },
    ],
  },
  {
    titulo: 'Restauraciones de Resina',
    abiertoPorDefecto: false,
    items: [
      { label: 'Resina Compuesta (R)',     value: 'RESINA_BUENO', color: 'blue' },
      { label: 'Resina Nanohíbrida (NH)',  value: 'RESINA_NHB',   color: 'blue' },
      { label: 'Resina Bulk-Fill (BF)',    value: 'RESINA_BLK',   color: 'blue' },
      { label: 'Resina Nanorrelleno (NF)', value: 'RESINA_NBF',   color: 'blue' },
      { label: 'Resina Fluida (RF)',       value: 'RESINA_FLOW',  color: 'blue' },
      { label: 'Amalgama (AM)',            value: 'AMALGAMA_BUENO', color: 'blue' },
      { label: 'Ionómero (IV)',            value: 'IONOMERO_BUENO', color: 'blue' },
      { label: 'Sellante (SE)',            value: 'SELLANTE',     color: 'blue' },
      { label: 'Sellante Defectuoso',      value: 'SELLANTE_DEF', color: 'red'  },
    ],
  },
  {
    titulo: 'Implantes',
    abiertoPorDefecto: false,
    items: [
      { label: 'Implante Titanio CI (ITI)',  value: 'IMPLANTE_TI',     color: 'blue' },
      { label: 'Implante Titanio CE (ITE)',  value: 'IMPLANTE_TE',     color: 'blue' },
      { label: 'Implante Zirconio (IZR)',    value: 'IMPLANTE_ZR',     color: 'blue' },
      { label: 'Mini-Implante (IMN)',        value: 'IMPLANTE_MINI',   color: 'blue' },
      { label: 'Implante Ti Indicado',       value: 'IMPLANTE_TI_IND', color: 'red'  },
      { label: 'Implante ZR Indicado',       value: 'IMPLANTE_ZR_IND', color: 'red'  },
    ],
  },
  {
    titulo: 'Endodoncia y Cirugía Radicular',
    abiertoPorDefecto: false,
    items: [
      { label: 'Tratamiento de Conductos',   value: 'ENDODONCIA',      color: 'blue' },
      { label: 'Endodoncia Indicada',        value: 'ENDODONCIA_IND',  color: 'red'  },
      { label: 'Pulpotomía Decidua (PD)',    value: 'PULPAR_PD',       color: 'blue' },
      { label: 'Apexificación (APX)',        value: 'PULPAR_APEX',     color: 'blue' },
      { label: 'Retratamiento (RT)',         value: 'RETRATAMIENTO',   color: 'blue' },
      { label: 'Cirugía Apical (CA)',        value: 'CIRUGIA_APICAL',  color: 'blue' },
      { label: 'Pulpectomía (PC)',           value: 'PULPAR_PC',       color: 'blue' },
      { label: 'Protección Pulpar (PP)',     value: 'PULPAR_PP',       color: 'blue' },
    ],
  },
  {
    titulo: 'Periodoncia',
    abiertoPorDefecto: false,
    items: [
      { label: 'Raspado y Alisado (RAR)',  value: 'PERIO_RAR', color: 'blue' },
      { label: 'Gingivectomía (GIN)',      value: 'PERIO_GIN', color: 'blue' },
      { label: 'Cirugía Periodontal (CIR)',value: 'PERIO_CIR', color: 'blue' },
      { label: 'Movilidad G1',             value: 'MOVILIDAD_M1', color: 'red'  },
      { label: 'Movilidad G2',             value: 'MOVILIDAD_M2', color: 'red'  },
      { label: 'Movilidad G3',             value: 'MOVILIDAD_M3', color: 'red'  },
    ],
  },
  {
    titulo: 'Anomalías de Posición',
    abiertoPorDefecto: false,
    items: [
      { label: 'Extruido',    value: 'EXTRUIDO',    color: 'blue' },
      { label: 'Intruido',    value: 'INTRUIDO',    color: 'blue' },
      { label: 'Giroversión', value: 'GIROVERSION', color: 'blue' },
      { label: 'Migración',   value: 'MIGRACION',   color: 'blue' },
    ],
  },
  {
    titulo: 'Anomalías y Otros',
    abiertoPorDefecto: false,
    items: [
      { label: 'Blanqueamiento (BL)',     value: 'BLANQUEAMIENTO',   color: 'blue' },
      { label: 'Macrodoncia',             value: 'MACRODONCIA',      color: 'blue' },
      { label: 'Microdoncia',             value: 'MICRODONCIA',      color: 'blue' },
      { label: 'Discromía',               value: 'DISCROMICO',       color: 'blue' },
      { label: 'Ectópico',                value: 'ECTOPICO',         color: 'blue' },
      { label: 'Clavija',                 value: 'CLAVIJA',          color: 'blue' },
      { label: 'Impactación',             value: 'IMPACTACION',      color: 'blue' },
      { label: 'Semi-impactación',        value: 'SEMI_IMPACTACION', color: 'blue' },
    ],
  },
];

// ─── table grouping ───────────────────────────────────────────────────────────

interface Hallazgo {
  fdi: number;
  superficie: NombreSuperficie | 'general';
  diagnostico: string;
  estadoSalud?: 'BIEN' | 'MAL';
}

interface RowAgrupado {
  fdi: number;
  diagnostico: string;
  estadoSalud?: 'BIEN' | 'MAL';
  superficies: (NombreSuperficie | 'general')[];
}

function agruparHallazgos(hallazgos: Hallazgo[]): RowAgrupado[] {
  const map = new Map<string, RowAgrupado>();
  for (const h of hallazgos) {
    const key = `${h.fdi}::${h.diagnostico}::${h.estadoSalud ?? ''}`;
    const row = map.get(key);
    if (row) {
      row.superficies.push(h.superficie);
    } else {
      map.set(key, { fdi: h.fdi, diagnostico: h.diagnostico, estadoSalud: h.estadoSalud, superficies: [h.superficie] });
    }
  }
  return Array.from(map.values());
}

function formatSups(sups: (NombreSuperficie | 'general')[]): string {
  if (sups.some((s) => s === 'general')) return 'General';
  return sups.map((s) => INICIAL_SUPERFICIE[s]).join(', ');
}

// ─── types ────────────────────────────────────────────────────────────────────

interface OdontogramaProps {
  idPaciente: number;
  modo?: 'diagnostico' | 'presupuesto';
  tipo?: 'INICIAL' | 'ACTUAL';
  readOnly?: boolean;
  onDienteClick?: (fdi: number) => void;
  onChange?: (dientes: DienteEstado[], idOdontograma: number | null, tratamientosMulti: OdontogramaMultipieza[]) => void;
  hideSaveButton?: boolean;
  /**
   * Dientes pre-cargados por el componente padre (OdontogramaTab).
   * Cuando se recibe un array no-vacío, se inicializa el estado directamente
   * con esos datos y se omite el fetch interno para evitar llamadas duplicadas.
   */
  initialDientes?: DienteEstado[];
  /**
   * ID del odontograma pre-cargado por el padre.
   * Permite inicializar idOdontograma sin esperar el fetch interno.
   */
  initialIdOdontograma?: number | null;
  /**
   * Indica que el padre (OdontogramaTab) ya realizó su propio GET y lo resolvió
   * — aunque el resultado haya sido "sin datos" (paciente nuevo).
   * Cuando es true, este componente OMITE su propio fetch para evitar la
   * petición duplicada que antes aparecía en la consola para pacientes
   * sin hallazgos registrados.
   */
  parentFetchDone?: boolean;
  /** FDIs que ya tienen un tratamiento planificado en el presupuesto actual. Muestra un indicador verde. */
  planificadoFdis?: Set<number>;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Odontograma({
  idPaciente,
  modo = 'diagnostico',
  tipo,
  readOnly = false,
  onDienteClick,
  onChange,
  hideSaveButton = false,
  initialDientes = [],
  initialIdOdontograma = null,
  parentFetchDone = false,
  planificadoFdis,
}: OdontogramaProps) {
  /**
   * Si el padre ya cargó los datos, los usamos como estado inicial:
   *  - Dientes que el backend envió (solo los no-SANO) se mezclan con
   *    el mapa base de ALL_FDI para que todos los dientes queden
   *    correctamente inicializados.
   *  - Dientes sin entrada en el backend permanecen en estado SANO.
   *
   * Si el padre NO proveyó datos (initialDientes vacío), empezamos en
   * blanco y el useEffect de abajo hará su propio fetch (comportamiento
   * original, retrocompatible).
   */
  const [idOdontograma, setIdOdontograma] = useState<number | null>(
    initialIdOdontograma,
  );

  const [dientes, setDientes] = useState<DienteEstado[]>(() => {
    if (initialDientes.length > 0) {
      // Mezcla: dientes del backend + el resto en SANO
      return ALL_FDI.map((fdi) => {
        const bd = initialDientes.find((x) => x.numeroFdi === fdi);
        return bd
          ? { ...bd, idOdontograma: initialIdOdontograma ?? bd.idOdontograma ?? 0 }
          : ESTADO_INICIAL_DIENTE(initialIdOdontograma ?? 0, fdi);
      });
    }
    return ALL_FDI.map((fdi) => ESTADO_INICIAL_DIENTE(0, fdi));
  });

  /**
   * skipFetch: true  → el padre pre-cargó datos O confirmó que no hay datos
   *                    (parentFetchDone), no repetir el GET al backend.
   * skipFetch: false → comportamiento original: <Odontograma /> hace su
   *                    propio fetch (cuando se usa standalone, sin OdontogramaTab).
   *
   * Usamos useRef para que el valor se fije en el primer render y no cause
   * re-ejecuciones del useEffect de carga.
   *
   * IMPORTANTE: incluir `parentFetchDone` aquí resuelve el caso en que el
   * padre hizo el fetch pero no encontró datos (paciente nuevo, todos SANO).
   * Sin esto, initialDientes.length === 0 causaba un segundo GET duplicado.
   */
  const skipFetch = useRef(
    initialDientes.length > 0 || initialIdOdontograma != null || parentFetchDone,
  );
  const [seleccionados,  setSeleccionados]  = useState<string[]>([]);
  const [contextoClic,   setContextoClic]   = useState<'CARA' | 'PIEZA' | null>(null);
  const [guardando,      setGuardando]      = useState(false);
  const [guardadoOk,     setGuardadoOk]     = useState(false);

  const [tratamientosMulti, setTratamientosMulti] = useState<OdontogramaMultipieza[]>([]);

  // Carga independiente para Tratamientos Multi-Pieza
  useEffect(() => {
    if (idOdontograma) {
      odontogramaService.getTratamientosMulti(idOdontograma)
        .then((data) => {
          if (data && Array.isArray(data)) {
            setTratamientosMulti(data);
          }
        })
        .catch((err) => console.error("Error al cargar tramos multipieza:", err));
    }
  }, [idOdontograma]);

  const DIAGNOSTICOS_MULTI = [
    { label: 'Prótesis Fija (Buen Estado)', value: 'PROTESIS_FIJA', color: 'AZUL' },
    { label: 'Prótesis Fija (Mal Estado)', value: 'PROTESIS_FIJA', color: 'ROJO' },
    { label: 'Prótesis Remov. (Buen Estado)', value: 'PROTESIS_REMOVIBLE', color: 'AZUL' },
    { label: 'Prótesis Remov. (Mal Estado)', value: 'PROTESIS_REMOVIBLE', color: 'ROJO' },
  ];

  // Limpia el contexto cuando el usuario quita todos los chips manualmente.
  useEffect(() => {
    if (seleccionados.length === 0) setContextoClic(null);
  }, [seleccionados.length]);

  const onChangeRef = useRef(onChange);
  // Mantiene la referencia al callback actualizada sin re-ejecutar efectos.
  useEffect(() => { onChangeRef.current = onChange; });

  // Notifica al padre SOLO cuando los datos cambian después del montaje inicial.
  // Evitamos disparar en el primer render porque el padre (OdontogramaTab) ya
  // inicializó su propio estado durante su propio fetch — llamar aquí causaría
  // un re-render extra e innecesario que era el origen del bucle anterior.
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;   // ← saltamos el disparo en el montaje inicial
    }
    onChangeRef.current?.(dientes, idOdontograma, tratamientosMulti);
  }, [dientes, idOdontograma, tratamientosMulti]);

  useEffect(() => {
    // ── Omitir si el padre ya pre-cargó los datos ──────────────────────────
    // Cuando OdontogramaTab pasa initialDientes/initialIdOdontograma,
    // el estado ya está inicializado correctamente arriba (en useState).
    // Hacer otro GET sería una llamada duplicada innecesaria.
    if (skipFetch.current) return;

    const cargarOdontograma = async () => {
      try {
        const response = await odontogramaService.getPorPaciente(idPaciente, tipo);
        console.log("Respuesta cruda del backend:", response);

        if (!response) { return; }

        const idExtraido = response?.idOdontograma ?? null;

        if (idExtraido) {
          setIdOdontograma(idExtraido);
          console.log("¡Éxito! ID del Odontograma cargado:", idExtraido);
        } else {
          console.error("El backend respondió, pero el ID del Odontograma no se encuentra en el JSON. Estructura:", response);
        }

        const fromDB: DienteEstado[] = response?.dientes ?? [];
        console.log('[Odontograma] fromDB — dientes no-SANO:', fromDB.filter((d) =>
          d.condicionGeneral !== 'SANO' ||
          d.estadoClinico === 'TRATADO' || d.estadoClinico === 'REALIZADO'
        ));

        setDientes((base) =>
          base.map((d) => {
            const bd = fromDB.find((x) => x.numeroFdi === d.numeroFdi);
            return bd
              ? { ...bd, idOdontograma: idExtraido ?? 0 }
              : { ...d,  idOdontograma: idExtraido ?? 0 };
          })
        );
      } catch (error) {
        console.error("Error al cargar el odontograma desde el backend:", error);
      }
    };

    cargarOdontograma();
  }, [idPaciente, tipo]);

  const getDiente = (fdi: number): DienteEstado =>
    dientes.find((d) => d.numeroFdi === fdi) ?? ESTADO_INICIAL_DIENTE(idOdontograma ?? 0, fdi);

  // ── derived selection flags ────────────────────────────────────────────────


  // ── selection handlers ─────────────────────────────────────────────────────

  const handleSelect = (fdi: number, zona: string) => {
    if (readOnly) return;
    if (modo === 'presupuesto') {
      setSeleccionados([`${fdi}-general`]);
      onDienteClick?.(fdi);
      return;
    }

    const nuevoContexto: 'CARA' | 'PIEZA' = zona === 'general' ? 'PIEZA' : 'CARA';
    const key = `${fdi}-${zona}`;

    // Cambio de contexto: resetear selección y mostrar el panel del nuevo tipo.
    if (nuevoContexto !== contextoClic) {
      setContextoClic(nuevoContexto);
      setSeleccionados([key]);
      return;
    }

    // Mismo contexto: toggle del ítem dentro de la selección actual.
    setSeleccionados((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const deseleccionar = (key: string) =>
    setSeleccionados((prev) => prev.filter((s) => s !== key));

  const limpiarSeleccion = () => {
    setSeleccionados([]);
    setContextoClic(null);
  };

  // ── Smart UI — aplica diagnóstico MINSA de un solo clic ──────────────────

  const aplicarDiagnosticoSmartUI = (value: string, estadoSaludFijo?: 'BIEN' | 'MAL') => {
    if (seleccionados.length === 0 || contextoClic === null) return;

    const byFdi = new Map<number, DienteEstado>();
    for (const key of seleccionados) {
      const dashIdx = key.indexOf('-');
      const fdi     = Number(key.slice(0, dashIdx));
      const zona    = key.slice(dashIdx + 1);
      const base    = byFdi.get(fdi) ?? getDiente(fdi);

      if (contextoClic === 'PIEZA') {
        const mapeoMinsa = obtenerMapeoMINSA(value, estadoSaludFijo);
        byFdi.set(fdi, {
          ...base,
          condicionGeneral: value as CondicionGeneral,
          estadoSalud: estadoSaludFijo,
          ...mapeoMinsa,
        });
      } else {
        const sup = ZONA_TO_SUP[zona];
        if (sup && sup !== 'general') {
          const mapeoMinsa = obtenerMapeoMINSA(value);
          byFdi.set(fdi, {
            ...base,
            [sup]: value as CondicionSuperficie,
            siglaRecuadro: mapeoMinsa.siglaRecuadro || base.siglaRecuadro,
            colorRecuadro: mapeoMinsa.colorRecuadro || base.colorRecuadro
          });
        }
      }
    }

    const updated = Array.from(byFdi.values()).map((d) => ({
      ...d,
      idOdontograma: idOdontograma ?? 0,
    }));
    setDientes((prev) =>
      prev.map((d) => updated.find((u) => u.numeroFdi === d.numeroFdi) ?? d),
    );
    limpiarSeleccion();
  };

  const aplicarDiagnosticoMulti = (tipo: any, color: 'AZUL' | 'ROJO') => {
    if (seleccionados.length < 2) {
      alert("Debe seleccionar al menos 2 piezas completas (inicio y fin) para trazar un puente o tramo.");
      return;
    }

    const fdis = seleccionados
      .filter(s => s.endsWith('-general'))
      .map(s => Number(s.split('-')[0]));

    if (fdis.length < 2) {
      alert("Por favor seleccione las piezas completas (clic en los números inferiores), no las caras.");
      return;
    }

    const piezaInicio = Math.min(...fdis);
    const piezaFin = Math.max(...fdis);

    const nuevoTratamiento: OdontogramaMultipieza = {
      idOdontograma: idOdontograma ?? 0,
      tipoTratamiento: tipo,
      color: color,
      piezaInicio,
      piezaFin
    };

    setTratamientosMulti(prev => [...prev, nuevoTratamiento]);
    limpiarSeleccion();
  };

  // ── annul grouped finding ──────────────────────────────────────────────────

  const handleAnularGrupo = async (
    fdi: number,
    superficies: (NombreSuperficie | 'general')[],
  ) => {
    let current = getDiente(fdi);
    for (const sup of superficies) {
      current =
        sup === 'general'
          ? { ...current, condicionGeneral: 'SANO', estadoSalud: undefined, siglaRecuadro: '', colorRecuadro: '', estadoClinico: 'SANO' }
          : { ...current, [sup]: 'SANO' as CondicionSuperficie, siglaRecuadro: '', colorRecuadro: '', estadoClinico: 'SANO' };
    }
    const updated = { ...current, idOdontograma: idOdontograma ?? 0 };
    setDientes((prev) => prev.map((d) => (d.numeroFdi === fdi ? updated : d)));
    try {
      await odontogramaService.guardarDiente(updated);
    } catch {
      console.error('Error al anular el hallazgo');
    }
  };

  const handleAnularMulti = (index: number) => {
    setTratamientosMulti((prev) => prev.filter((_, i) => i !== index));
    // Nota: Aquí luego agregaremos la llamada al backend para eliminar de la BD
  };

  // ── batch save ────────────────────────────────────────────────────────────

  const handleGuardarOdontograma = async () => {
    if (!idOdontograma) {
      console.error("Error: No hay un Odontograma activo.");
      return;
    }

    const dientesModificados = dientes.filter(
      (d) => d.condicionGeneral !== 'SANO' || SUPERFICIES.some((sup) => d[sup] !== 'SANO')
    );

    setGuardando(true);
    setGuardadoOk(false);
    try {
      // 1. Promesas para guardar los dientes individuales
      const promesasDientes = dientesModificados.map((diente) => {
        const payload = {
          ...diente,
          idOdontograma: idOdontograma,
        };
        return odontogramaService.guardarDiente(payload);
      });

      // 2. Promesa para sobrescribir los tratamientos multi-pieza en bloque
      const promesaMulti = odontogramaService.guardarTratamientosMulti(idOdontograma, tratamientosMulti);

      // 3. Ejecutar todo de manera concurrente
      await Promise.all([...promesasDientes, promesaMulti]);

      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 4000);
    } catch (error) {
      console.error("Error al guardar el odontograma:", error);
    } finally {
      setGuardando(false);
    }
  };

  // ── compute findings ───────────────────────────────────────────────────────

  const hallazgos: Hallazgo[] = dientes.flatMap((d) => {
    const rows: Hallazgo[] = [];
    if (d.condicionGeneral !== 'SANO') {
      rows.push({ fdi: d.numeroFdi, superficie: 'general', diagnostico: d.condicionGeneral, estadoSalud: d.estadoSalud });
    }
    for (const sup of SUPERFICIES) {
      if (d[sup] !== 'SANO') {
        rows.push({ fdi: d.numeroFdi, superficie: sup, diagnostico: d[sup] });
      }
    }
    return rows;
  });

  const hallazgosAgrupados = agruparHallazgos(hallazgos);

  // ── render helpers ─────────────────────────────────────────────────────────

  const renderTooth = (fdi: number) => {
    const diente  = getDiente(fdi);
    const isUpper = [1, 2, 5, 6].includes(Math.floor(fdi / 10));

    let boxCls = 'border-slate-300 text-slate-300';
    if (diente.siglaRecuadro) {
      if (diente.colorRecuadro === 'ROJO') {
        boxCls = 'border-red-500 text-red-600 bg-red-50';
      } else if (diente.colorRecuadro === 'AZUL') {
        boxCls = 'border-blue-500 text-blue-600 bg-blue-50';
      }
    }

    return (
      <div key={fdi} className={`flex ${isUpper ? 'flex-col' : 'flex-col-reverse'} items-center gap-1.5 shrink-0`}>
        <div className={`w-8 h-5 border flex items-center justify-center text-[10px] font-bold rounded-sm ${boxCls}`}>
          {diente.siglaRecuadro || ''}
        </div>
        <span id={`diente-${fdi}`} className="relative inline-flex">
          <DienteSVG
            fdi={fdi}
            estado={diente}
            seleccionados={seleccionados.filter((s) => s.startsWith(`${fdi}-`))}
            onSelect={handleSelect}
            readOnly={readOnly}
          />
          {planificadoFdis?.has(fdi) && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white z-10 pointer-events-none" />
          )}
        </span>
      </div>
    );
  };

  const renderRow = (fdis: number[], split: number) => (
    <div className="flex justify-center items-center gap-0.5 w-full">
      {fdis.slice(0, split).map(renderTooth)}
      <div className="w-px self-stretch bg-slate-200 mx-1.5 shrink-0" />
      {fdis.slice(split).map(renderTooth)}
    </div>
  );

  // ── jsx ────────────────────────────────────────────────────────────────────

  const hayCambiosDientes = dientes.some((d) => d.condicionGeneral !== 'SANO' || SUPERFICIES.some((sup) => d[sup] !== 'SANO'));
  const hayTramos = tratamientosMulti.length > 0;
  const disableGuardar = guardando || (!hayCambiosDientes && !hayTramos);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-3 py-4 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Odontograma Interactivo</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {modo === 'presupuesto'
              ? 'Selecciona una pieza para asignarle un tratamiento'
              : 'Nomenclatura FDI · Dentición adulta y pediátrica'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {modo !== 'presupuesto' && !readOnly && guardando && (
            <span className="text-xs text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 animate-pulse">
              Guardando...
            </span>
          )}
          {modo !== 'presupuesto' && !readOnly && guardadoOk && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ✓ Odontograma guardado correctamente
            </span>
          )}
        </div>
      </div>

      {/* ── Legend COP ── */}
      {modo !== 'presupuesto' && !readOnly && <div className="pb-5 border-b border-slate-100 space-y-3">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Simbología — Norma Técnica COP
        </p>

        {/* Superficies + materiales + selección */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Sup.</span>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-white border border-slate-400 shrink-0" />
            <span className="text-xs text-slate-500">Sano</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-red-500 shrink-0" />
            <span className="text-xs text-slate-500">Caries</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 shrink-0" />
            <span className="text-xs text-slate-500">Restaurado</span>
          </div>

          <div className="flex items-center gap-1.5">
            {['R', 'AM', 'IV', 'PC'].map((abbr) => (
              <span
                key={abbr}
                className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 py-0.5 leading-none"
              >
                {abbr}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-400 shrink-0" />
            <span className="text-xs text-slate-500">Seleccionado</span>
          </div>
        </div>

        {/* Condición general — símbolos gráficos */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Pieza</span>

          {/* X azul — Ausente / Extraído */}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
              <line x1="1" y1="1" x2="13" y2="13" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="13" y1="1" x2="1" y2="13" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-slate-500">Ausente</span>
          </div>

          {/* X rojo — Extracción indicada */}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
              <line x1="1" y1="1" x2="13" y2="13" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="13" y1="1" x2="1" y2="13" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-slate-500">Extracción Ind.</span>
          </div>

          {/* Círculo azul — Corona definitiva */}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
              <circle cx="7" cy="7" r="5.5" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
            </svg>
            <span className="text-xs text-slate-500">Corona Def.</span>
          </div>

          {/* Círculo rojo — Corona temporal */}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
              <circle cx="7" cy="7" r="5.5" fill="none" stroke="#EF4444" strokeWidth="1.5" />
            </svg>
            <span className="text-xs text-slate-500">Corona Temp.</span>
          </div>

          {/* Línea roja — Endodoncia (diagnóstico / sin confirmar) */}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
              <line x1="7" y1="1" x2="7" y2="13" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-slate-500">Endodoncia</span>
          </div>

          {/* Línea azul — Endodoncia tratada (confirmado BIEN) */}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
              <line x1="7" y1="1" x2="7" y2="13" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-slate-500">End. Tratada</span>
          </div>

          {/* IMP rojo — Implante (diagnóstico / sin confirmar) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-red-500 leading-none">IMP</span>
            <span className="text-xs text-slate-500">Implante</span>
          </div>

          {/* IMP azul — Implante tratado (confirmado BIEN) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-blue-600 leading-none">IMP</span>
            <span className="text-xs text-slate-500">Impl. Tratado</span>
          </div>
        </div>
      </div>}

      {/* ── Main: map + panel ── */}
      <div className="flex gap-6 items-start">

       {/* LEFT — tooth map */}
        <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div
            id="mapa-dientes-container"
            className="relative w-max min-w-[650px] mx-auto space-y-0.5 px-2"
          >

            <div className="flex justify-between px-10 mb-0.5">
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Der.</span>
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Izq.</span>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1">
              Superior / Maxilar
            </p>

            {renderRow(ADULT_UPPER, 8)}
            <div className="mt-6">{renderRow(CHILD_UPPER, 5)}</div>

            <div className="relative my-6 mx-4">
              <div className="border-t-2 border-dashed border-slate-200" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-[9px] text-slate-400 font-semibold uppercase tracking-widest">
                Plano Oclusal
              </span>
            </div>

            <div className="mb-6">{renderRow(CHILD_LOWER, 5)}</div>
            {renderRow(ADULT_LOWER, 8)}

            <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">
              Inferior / Mandíbular
            </p>

            <CapaMultipieza tratamientos={tratamientosMulti} dientes={dientes} />
          </div>
        </div>

        {/* Vertical divider */}
        {modo !== 'presupuesto' && !readOnly && <div className="w-px self-stretch bg-slate-100 shrink-0" />}

        {/* RIGHT — Smart UI · Panel contextual MINSA */}
        {modo !== 'presupuesto' && !readOnly && (
          <div className="w-72 shrink-0 space-y-4">

            {/* ── Cabecera del panel ── */}
            <div className="flex items-center gap-2">
              <div className={`w-1 h-4 rounded-full transition-colors ${
                contextoClic === 'CARA'  ? 'bg-blue-500' :
                contextoClic === 'PIEZA' ? 'bg-emerald-500' :
                'bg-sky-400'
              }`} />
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {contextoClic === 'CARA'  ? 'Diagnóstico · Cara' :
                 contextoClic === 'PIEZA' ? 'Diagnóstico · Pieza' :
                 'Panel de Diagnóstico'}
              </h4>
              {seleccionados.length > 0 && (
                <span className="ml-auto text-[10px] font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5">
                  {seleccionados.length} sel.
                </span>
              )}
            </div>

            {/* ── Estado vacío: ningún ítem seleccionado ── */}
            {contextoClic === null && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center">
                <div className="w-9 h-9 mx-auto mb-3 rounded-full bg-slate-200 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400">
                    <path d="M12 2C8.5 2 7 5 7 8c0 3 1 5 2 8.5.4 1.5 1.3 3.5 3 3.5s2.6-2 3-3.5C16 13 17 11 17 8c0-3-1.5-6-5-6z" />
                  </svg>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seleccione una cara o la pieza completa en el odontograma para diagnosticar
                </p>
              </div>
            )}

            {/* ── Panel activo: CARA o PIEZA ── */}
            {contextoClic !== null && seleccionados.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">

                {/* Título contextual */}
                <div className="pb-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-700">
                    {(() => {
                      const first    = seleccionados[0];
                      const dashIdx  = first.indexOf('-');
                      const fdi      = first.slice(0, dashIdx);
                      const zona     = first.slice(dashIdx + 1);
                      if (contextoClic === 'CARA') {
                        return seleccionados.length === 1
                          ? `Pieza ${fdi} · Cara ${LABEL_ZONA[zona] ?? zona}`
                          : `${seleccionados.length} caras seleccionadas`;
                      }
                      return seleccionados.length === 1
                        ? `Pieza ${fdi} · Completa`
                        : `${seleccionados.length} piezas seleccionadas`;
                    })()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {contextoClic === 'CARA'
                      ? 'Diagnóstico de superficie — Norma Técnica MINSA'
                      : 'Diagnóstico de pieza entera — Norma Técnica MINSA'}
                  </p>
                </div>

                {/* Chips de selección */}
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {seleccionados.map((key) => {
                    const dashIdx = key.indexOf('-');
                    const fdi     = key.slice(0, dashIdx);
                    const zona    = key.slice(dashIdx + 1);
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-0.5 text-[9px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                      >
                        <span className="font-bold text-slate-800">{fdi}</span>
                        <span className="text-slate-300">·</span>
                        {LABEL_ZONA[zona] ?? zona}
                        <button
                          onClick={() => deseleccionar(key)}
                          className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors leading-none"
                          aria-label={`Quitar ${key}`}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* ── Acordeones CARA / PIEZA ── */}
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                  {(contextoClic === 'CARA' ? GRUPOS_CARA : GRUPOS_PIEZA).map((grupo) => (
                    <details key={grupo.titulo} className="group bg-white border border-slate-200 rounded-lg overflow-hidden" open={grupo.abiertoPorDefecto ?? true}>
                      <summary className="px-3 py-2 bg-slate-50 text-[9px] font-bold text-slate-600 uppercase tracking-widest cursor-pointer select-none flex justify-between items-center hover:bg-slate-100 transition-colors">
                        {grupo.titulo}
                        <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-2 grid grid-cols-2 gap-1.5 border-t border-slate-100">
                        {grupo.items.map(({ label, value, color }) => (
                          <button
                            key={value}
                            onClick={() => aplicarDiagnosticoSmartUI(value)}
                            className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-2 rounded-md border active:scale-[0.97] transition-all text-left leading-tight ${
                              color === 'blue'
                                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>

                {/* ── Tratamientos Multi-Pieza (Tramos) — solo contexto PIEZA ── */}
                {contextoClic === 'PIEZA' && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mt-2">
                      Tratamientos Multi-Pieza (Tramos)
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {DIAGNOSTICOS_MULTI.map(({ label, value, color }) => (
                        <button
                          key={`${value}-${color}`}
                          onClick={() => aplicarDiagnosticoMulti(value, color as 'AZUL' | 'ROJO')}
                          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-2.5 rounded-lg border active:scale-[0.97] transition-all text-left leading-tight ${
                            color === 'AZUL'
                              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${color === 'AZUL' ? 'bg-blue-500' : 'bg-red-500'}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Limpiar selección ── */}
                <button
                  onClick={limpiarSeleccion}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Limpiar selección
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Findings table (grouped) ── */}
      {modo !== 'presupuesto' && (hallazgosAgrupados.length > 0 || tratamientosMulti.length > 0) && (
        <div className="border-t border-slate-100 pt-5">

          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-amber-400 rounded-full" />
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Hallazgos Clínicos
            </h4>
            <span className="ml-auto text-[10px] text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5 font-medium">
              {hallazgosAgrupados.length} {hallazgosAgrupados.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Pieza', 'Sup.', 'Diagnóstico', 'Acción'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-semibold text-slate-500 px-3 py-3 whitespace-nowrap uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hallazgosAgrupados.map(({ fdi, diagnostico, estadoSalud: es, superficies }) => (
                  <tr
                    key={`${fdi}-${diagnostico}-${es ?? ''}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-slate-700">{fdi}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {formatSups(superficies)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getBadge(diagnostico)}`}>
                        {getLabelHallazgo(diagnostico, es)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {!readOnly && (
                        <button
                          onClick={() => handleAnularGrupo(fdi, superficies)}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors whitespace-nowrap"
                        >
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {tratamientosMulti.map((t, index) => (
                  <tr
                    key={`multi-${index}-${t.piezaInicio}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-slate-700">{t.piezaInicio} - {t.piezaFin}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      Tramo Completo
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.color === 'AZUL' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {t.tipoTratamiento.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {!readOnly && (
                        <button
                          onClick={() => handleAnularMulti(index)}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors whitespace-nowrap"
                        >
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Global save button ── */}
      {modo !== 'presupuesto' && !readOnly && !hideSaveButton && <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-400">
          Los cambios del odontograma no se envían hasta que presione "Guardar Odontograma".
        </p>
        <button
          onClick={handleGuardarOdontograma}
          disabled={disableGuardar}
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {guardando ? 'Guardando...' : 'Guardar Odontograma'}
        </button>
      </div>}

    </div>
  );
}