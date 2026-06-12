# Prompt 05 — Reporte de Ingresos por Período
> Tarea ROADMAP 2.4 · Backend + Frontend · ~4h

---

## Objetivo
Implementar un **reporte de ingresos por rango de fechas** con:
- **Backend**: nuevo endpoint `GET /api/pagos/reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- **Frontend**: nueva página `ReportePage.tsx` con selector de fechas, tabla de resumen y gráfico de barras en SVG puro

---

## PARTE A — Backend (Spring Boot)

### Archivos a crear/modificar en `next-dent-api/`

#### 1. DTO de respuesta — `PagoReporteDTO.java`
Crear en el paquete de DTOs existente:

```java
public class PagoReporteDTO {
    private BigDecimal totalPeriodo;
    private int totalPagos;
    private List<PagoPorDiaDTO> porDia;

    // constructores, getters, setters
}
```

```java
public class PagoPorDiaDTO {
    private String fecha;        // "2025-06-10"
    private BigDecimal monto;
    private int cantidadPagos;

    // constructores, getters, setters
}
```

#### 2. Método en `PagoRepository.java` (o `PagoRepositoryCustom`)
Agregar una query que filtre pagos por rango de fechas usando `fechaPago`:

```java
@Query("SELECT p FROM Pago p WHERE DATE(p.fechaPago) >= :desde AND DATE(p.fechaPago) <= :hasta")
List<Pago> findByFechaPagoBetween(
    @Param("desde") LocalDate desde,
    @Param("hasta") LocalDate hasta
);
```

> ⚠️ Verificar el nombre exacto del campo `fechaPago` en la entidad `Pago.java` — puede llamarse `fecha`, `fechaPago`, `createdAt`. Adaptarlo a lo que ya existe.

#### 3. Método en `PagoService.java`

```java
public PagoReporteDTO generarReporte(LocalDate desde, LocalDate hasta) {
    List<Pago> pagos = pagoRepository.findByFechaPagoBetween(desde, hasta);

    BigDecimal total = pagos.stream()
        .map(Pago::getMontoTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    // Agrupar por fecha
    Map<LocalDate, List<Pago>> porDia = pagos.stream()
        .collect(Collectors.groupingBy(p -> p.getFechaPago().toLocalDate()));

    List<PagoPorDiaDTO> listaPorDia = porDia.entrySet().stream()
        .sorted(Map.Entry.comparingByKey())
        .map(e -> new PagoPorDiaDTO(
            e.getKey().toString(),
            e.getValue().stream().map(Pago::getMontoTotal).reduce(BigDecimal.ZERO, BigDecimal::add),
            e.getValue().size()
        ))
        .collect(Collectors.toList());

    return new PagoReporteDTO(total, pagos.size(), listaPorDia);
}
```

> Adaptar `getMontoTotal()` al getter real de la entidad `Pago`. Verificar con `grep -r "montoTotal\|monto_total" src/`.

#### 4. Endpoint en `PagoController.java`
Agregar al controlador existente:

```java
@GetMapping("/reporte")
public ResponseEntity<PagoReporteDTO> getReporte(
    @RequestParam("desde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
    @RequestParam("hasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
) {
    return ResponseEntity.ok(pagoService.generarReporte(desde, hasta));
}
```

#### 5. Verificar que no hay conflicto de CORS
El controlador ya debería tener `@CrossOrigin` o un filtro global de CORS. No agregar `@CrossOrigin` duplicado.

#### Compilar y probar el backend:
```bash
cd next-dent-api
./mvnw compile
# Probar con curl:
curl "http://localhost:8080/api/pagos/reporte?desde=2025-06-01&hasta=2025-06-30"
```

---

## PARTE B — Frontend (React + TypeScript)

### 1. Tipo TypeScript — crear o agregar en `src/types/`

```typescript
// src/types/reporte.ts
export interface PagoPorDia {
  fecha: string;        // "2025-06-10"
  monto: number;
  cantidadPagos: number;
}

export interface PagoReporte {
  totalPeriodo: number;
  totalPagos: number;
  porDia: PagoPorDia[];
}
```

### 2. Servicio — agregar en `src/services/pagoService.ts`

```typescript
export async function getReporte(desde: string, hasta: string): Promise<PagoReporte> {
  const { data } = await axios.get(`http://localhost:8080/api/pagos/reporte`, {
    params: { desde, hasta }
  });
  return data;
}
```

### 3. Nueva página — `src/pages/ReportePage.tsx`

**Estado local:**
```typescript
const [desde, setDesde] = useState<string>(() => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0]; // primer día del mes actual
});
const [hasta, setHasta] = useState<string>(new Date().toISOString().split('T')[0]);
const [reporte, setReporte] = useState<PagoReporte | null>(null);
const [cargando, setCargando] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Estructura visual de la página:**

```
┌──────────────────────────────────────────────────────────┐
│ HEADER: "Reporte de Ingresos"                           │
├──────────────────────────────────────────────────────────┤
│ FILTROS: [Desde: input date] [Hasta: input date] [Generar reporte ▶] │
├────────────────────┬─────────────────────────────────────┤
│ KPI cards (2):     │                                     │
│  Total período     │  Gráfico de barras SVG              │
│  Cantidad de pagos │  (ingresos por día)                 │
├────────────────────┴─────────────────────────────────────┤
│ Tabla detalle: Fecha | Cantidad pagos | Monto del día    │
└──────────────────────────────────────────────────────────┘
```

#### Atajos de período (botones rápidos antes del selector de fechas):
```
[Esta semana]  [Este mes]  [Mes anterior]
```
Al hacer click, calculan y setean `desde`/`hasta` automáticamente.

#### Gráfico de barras en SVG puro
Implementar dentro de la misma página como subcomponente interno `<GraficoBarras>`:

```typescript
interface GraficoBarrasProps {
  datos: PagoPorDia[];
}
```

- `viewBox="0 0 600 300"`
- Eje Y: de 0 al máximo `monto` del período, con 5 líneas guía horizontales
- Eje X: fechas del período (solo día del mes si el rango es ≤ 31 días)
- Barras: `fill="#6366F1"` (indigo-500), `rx="4"` para bordes redondeados
- Hover (`:hover`): `fill="#4F46E5"` — usar CSS en línea o clase Tailwind
- Tooltip al hover: mostrar `S/ monto` encima de la barra (usar `<title>` SVG o un estado de hover)
- Ancho de barra: calculado dinámicamente según cantidad de días en el período
- Si el período tiene 0 días con datos: mostrar texto centrado "Sin datos para el período seleccionado"

**Fórmula de altura de barra:**
```
maxMonto = Math.max(...datos.map(d => d.monto))
alturaMax = 220  // px disponibles para barras
barHeight = (dia.monto / maxMonto) * alturaMax
barY = 240 - barHeight  // 240 = línea base
```

#### Tabla de detalle
```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-slate-200">
      <th className="text-left py-2 text-slate-500 font-medium">Fecha</th>
      <th className="text-right py-2 text-slate-500 font-medium">Pagos</th>
      <th className="text-right py-2 text-slate-500 font-medium">Total</th>
    </tr>
  </thead>
  <tbody>
    {reporte.porDia.map(dia => (
      <tr key={dia.fecha} className="border-b border-slate-100 hover:bg-slate-50">
        <td className="py-2">{formatFecha(dia.fecha)}</td>
        <td className="py-2 text-right">{dia.cantidadPagos}</td>
        <td className="py-2 text-right font-medium">S/ {dia.monto.toFixed(2)}</td>
      </tr>
    ))}
  </tbody>
  <tfoot>
    <tr className="font-semibold text-slate-800">
      <td className="py-2">Total</td>
      <td className="py-2 text-right">{reporte.totalPagos}</td>
      <td className="py-2 text-right">S/ {reporte.totalPeriodo.toFixed(2)}</td>
    </tr>
  </tfoot>
</table>
```

#### Función auxiliar de formato de fecha
```typescript
function formatFecha(iso: string): string {
  // "2025-06-10" → "10 Jun 2025"
  const [y, m, d] = iso.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m)-1]} ${y}`;
}
```

### 4. Registrar la ruta en `App.tsx`
```tsx
import ReportePage from './pages/ReportePage';
// ...
<Route path="/reporte" element={<ReportePage />} />
```

### 5. Agregar al Sidebar
En `components/Sidebar.tsx`, agregar un nuevo item de navegación:
- Label: "Reportes"
- Ruta: `/reporte`
- Ícono SVG: gráfico de barras (dibujar inline, similar a los demás ítems del sidebar)
- Posición: después de "Pagos" / "Caja" en el menú

---

## Pasos de implementación sugeridos

**Backend primero:**
1. Crear `PagoReporteDTO.java` y `PagoPorDiaDTO.java`.
2. Agregar query en `PagoRepository.java`.
3. Agregar método en `PagoService.java`.
4. Agregar endpoint en `PagoController.java`.
5. Compilar y probar con `curl`.

**Frontend después (solo si backend compila y responde):**
6. Crear `src/types/reporte.ts`.
7. Agregar `getReporte` en `pagoService.ts`.
8. Crear `ReportePage.tsx`.
9. Registrar ruta en `App.tsx`.
10. Agregar item en `Sidebar.tsx`.
11. Ejecutar `npx tsc --noEmit`.

---

## Lo que NO hacer
- No instalar librerías de gráficos (Chart.js, Recharts, etc.) — SVG puro.
- No crear un endpoint que devuelva todos los pagos y calcular en cliente — el backend agrupa por día.
- No usar `localStorage` ni `sessionStorage`.
- No agregar dependencias npm nuevas.

---

## Verificación final
```bash
# Backend
curl "http://localhost:8080/api/pagos/reporte?desde=2025-06-01&hasta=2025-06-30"
# Debe devolver JSON con totalPeriodo, totalPagos, porDia[]

# Frontend
npx tsc --noEmit
```
Probar manualmente:
- [ ] La ruta `/reporte` carga la página
- [ ] "Reporte" aparece en el sidebar
- [ ] El selector de fechas preselecciona el mes actual
- [ ] Los atajos "Esta semana / Este mes / Mes anterior" ajustan las fechas
- [ ] El botón "Generar reporte" dispara el fetch al backend
- [ ] El gráfico de barras muestra los datos correctamente
- [ ] La tabla lista el detalle por día con totales en el footer
- [ ] Los KPI cards muestran totalPeriodo y totalPagos
