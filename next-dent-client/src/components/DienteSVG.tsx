import React from 'react';
import type { DienteEstado, NombreSuperficie } from '../types/odontograma';

const AZUL = '#3b82f6';
const ROJO = '#ef4444';

// ─── LÓGICA DE COLORES: PROTECCIÓN DE FORMA ───────────────────────────────────

function faceColor(val: string | null | undefined, isTratado: boolean): string {
  // 1. BLOQUEO: Si la cara está sana, se queda blanca SIEMPRE. 
  if (!val || val === 'SANO') return '#FFFFFF';
  
  // 2. EVOLUCIÓN: Si la cara tiene un daño (ej. Caries) y el diente fue curado, muta a azul.
  if (isTratado) return AZUL; 
  
  // 3. DIAGNÓSTICO: Daños y caries iniciales se pintan de rojo.
  if (val === 'CARIES' || val.startsWith('RESTAURADO_DEF') || val === 'RESTAURADO_TEMP') return ROJO;
  
  // 4. HISTORIAL: Tratamientos previos ya curados se mantienen azules.
  if (val === 'TRATADO' || val === 'REALIZADO' || val === 'TRATADO_AZUL') return AZUL;
  if (val.startsWith('RESTAURADO')) return AZUL;
  
  return '#D1D5DB';
}

function colorCondicionGeneral(condicion: string, estadoSalud?: 'BIEN' | 'MAL', isTratado?: boolean): string {
  // INTERRUPTOR MAESTRO: Si ya se evolucionó, respetamos la forma pero forzamos el Azul.
  if (isTratado) return AZUL;

  switch (condicion) {
    case 'TRATADO':
    case 'REALIZADO':
    case 'AUSENTE':
    case 'EXTRAIDO':
      return AZUL;
    case 'EXTRACCION':
    case 'INDICADO_PARA_EXTRACCION':
    case 'CORONA_TEMP':
      return ROJO; // Diagnósticos iniciales (Rojo)
    case 'CORONA_DEF':
    case 'CORONA':
    case 'ENDODONCIA':
    case 'ENDODONCIA_IND':
    case 'IMPLANTE':
    case 'IMPLANTE_IND':
      return estadoSalud === 'BIEN' ? AZUL : ROJO;
    default:
      return AZUL;
  }
}

// ─── LAYOUT DE POLÍGONOS (viewBox 0 0 60 90) ──────────────────────────────────

interface CaraConfig {
  zona: string;
  sup: NombreSuperficie;
  puntos: string;
}

const CARAS: CaraConfig[] = [
  { zona: 'vestibular', sup: 'supVestibular', puntos: '5,3 55,3 40,18 20,18' },
  { zona: 'lingual',    sup: 'supLingual',    puntos: '5,48 55,48 40,33 20,33' },
  { zona: 'mesial',     sup: 'supMesial',     puntos: '5,3 20,18 20,33 5,48' },
  { zona: 'distal',     sup: 'supDistal',     puntos: '55,3 40,18 40,33 55,48' },
  { zona: 'oclusal',    sup: 'supOclusal',    puntos: '20,18 40,18 40,33 20,33' },
];

interface DienteSVGProps {
  fdi: number;
  estado: DienteEstado;
  seleccionados: string[];
  onSelect: (fdi: number, zona: string) => void;
  readOnly?: boolean;
}

const DienteSVG: React.FC<DienteSVGProps> = ({ fdi, estado, seleccionados, onSelect, readOnly: _readOnly = false }) => {
  const cg  = estado.condicionGeneral;
  
  // VERIFICACIÓN DE EVOLUCIÓN: ¿El backend ya marcó este diente como REALIZADO?
  const isTratado =
    cg === 'TRATADO' || cg === 'REALIZADO' ||
    estado.estadoClinico === 'TRATADO' || estado.estadoClinico === 'REALIZADO';

  const showX        = cg === 'AUSENTE' || cg === 'EXTRAIDO' || cg === 'EXTRACCION' || cg === 'INDICADO_PARA_EXTRACCION';
  const xColor       = colorCondicionGeneral(cg, estado.estadoSalud, isTratado);

  const isCoronaDef    = cg === 'CORONA_DEF' || cg === 'CORONA';
  const isCoronaTemp   = cg === 'CORONA_TEMP';
  const isEndodoncia   = cg === 'ENDODONCIA' || cg === 'ENDODONCIA_IND';
  const isImplante     = cg === 'IMPLANTE' || cg === 'IMPLANTE_IND';

  const selGeneral = seleccionados.includes(`${fdi}-general`);

  const tc = estado.trazoCorona ?? null;
  const tr = estado.trazoRaiz   ?? null;

  // Forzamos los colores de los trazos superpuestos según la evolución
  const tcColor = isTratado ? AZUL : (tc?.includes('AZUL') ? AZUL : ROJO);
  const trColor = isTratado ? AZUL : (tr?.includes('AZUL') ? AZUL : ROJO);

  return (
    <svg viewBox="0 0 60 90" className="w-[40px] h-auto shrink-0" aria-label={`Diente ${fdi}`}>

        {/* ── Borde de selección general ── */}
        {selGeneral && (
          <rect x="1" y="1" width="58" height="88" fill="none" stroke="#FBBF24" strokeWidth="2" rx="2" />
        )}

        {/* ── Caras del Diente (Sensibles al isTratado) ── */}
        {CARAS.map(({ zona, sup, puntos }) => {
          const isSel = seleccionados.includes(`${fdi}-${zona}`);
          const faceCursor = showX ? 'cursor-default opacity-40' : 'hover:brightness-90 cursor-pointer';
          const faceClick = showX ? undefined : (e: React.MouseEvent) => { e.stopPropagation(); onSelect(fdi, zona); };
          
          return (
            <polygon
              key={zona}
              points={puntos}
              fill={faceColor(estado[sup], isTratado)}
              stroke={isSel ? '#FBBF24' : '#1e293b'}
              strokeWidth={isSel ? '2.5' : '1'}
              strokeLinejoin="round"
              className={faceCursor}
              onClick={faceClick}
            />
          );
        })}

        {/* ── Raíz (Hitbox y Visual) ── */}
        <polygon points="10,45 50,45 30,80" fill="transparent" stroke="none" style={{ pointerEvents: 'all' }} className="cursor-pointer" onClick={() => onSelect(fdi, 'general')} />
        <polygon points="16,48 44,48 30,73" fill="white" stroke="#1e293b" strokeWidth="1" className="cursor-pointer hover:opacity-80 hover:stroke-blue-400" onClick={() => onSelect(fdi, 'general')} />

        {/* ── Número FDI ── */}
        <rect x="15" y="70" width="30" height="20" fill="transparent" stroke="none" style={{ pointerEvents: 'all' }} className="cursor-pointer" onClick={() => onSelect(fdi, 'general')} />
        <text x="30" y="85" textAnchor="middle" fontSize="13" fontWeight="700" fill={selGeneral ? '#EAB308' : '#334155'} className="cursor-pointer" onClick={() => onSelect(fdi, 'general')}>
          {fdi}
        </text>

        {/* ── Símbolos Clínicos Generales ── */}
        
        {showX && (
          <>
            <line x1="5" y1="3" x2="55" y2="48" stroke={xColor} strokeWidth="3" strokeLinecap="round" />
            <line x1="55" y1="3" x2="5" y2="48" stroke={xColor} strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {isCoronaDef && (
          <ellipse cx="30" cy="25.5" rx="27" ry="24" fill="none" stroke={xColor} strokeWidth="2.5" />
        )}

        {isCoronaTemp && (
          <ellipse cx="30" cy="25.5" rx="27" ry="24" fill="none" stroke={isTratado ? AZUL : ROJO} strokeWidth="2.5" />
        )}

        {isEndodoncia && (
          <line x1="30" y1="48" x2="30" y2="73" stroke={xColor} strokeWidth="2.5" strokeLinecap="round" />
        )}

        {isImplante && (
          <text x="30" y="64" textAnchor="middle" fontSize="8" fontWeight="bold" fill={xColor}>IMP</text>
        )}

        {/* ── Trazos MINSA Superpuestos (Fase 3B) ── */}
        
        {(tc === 'X_AZUL' || tc === 'X_ROJA') && (
          <>
            <line x1="5" y1="3" x2="55" y2="48" stroke={tcColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="55" y1="3" x2="5" y2="48" stroke={tcColor} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {(tc === 'CIRCULO_AZUL' || tc === 'CIRCULO_ROJO') && (
          <ellipse cx="30" cy="25.5" rx="27" ry="24" fill="none" stroke={tcColor} strokeWidth="2.5" />
        )}

        {tc === 'TRIANGULO_AZUL' && (
          <polygon points="30,71 15,88 45,88" fill="none" stroke={tcColor} strokeWidth="1.5" />
        )}

        {tc === 'FLECHA_ARRIBA_AZUL' && (
          <path d="M30,22 L30,0 M25,5 L30,0 L35,5" fill="none" stroke={tcColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {tc === 'FLECHA_ABAJO_AZUL' && (
          <path d="M30,0 L30,22 M25,17 L30,22 L35,17" fill="none" stroke={tcColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {tc === 'FLECHA_CURVA_AZUL' && (
          <path d="M 15,14 Q 30,2 45,14 M 39,9 L 45,14 L 49,8" fill="none" stroke={tcColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {tc === 'FLECHA_HORIZONTAL_AZUL' && (
          <path d="M 12,4 L 48,4 M 42,0 L 48,4 L 42,8" fill="none" stroke={tcColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* ── Trazos de Raíz MINSA ── */}
        {tr === 'LINEA_VERTICAL_AZUL' && (
          <line x1="30" y1="48" x2="30" y2="73" stroke={trColor} strokeWidth="2.5" strokeLinecap="round" />
        )}

        {tr === 'RR_ROJO' && (
          <text x="30" y="65" textAnchor="middle" fontSize="11" fontWeight="bold" fill={trColor}>RR</text>
        )}
    </svg>
  );
};

export default DienteSVG;