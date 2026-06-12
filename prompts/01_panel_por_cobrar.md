
Eres un desarrollador full stack experto en React (TypeScript) y Spring Boot. Trabajas sobre el
proyecto Next Dent, un sistema de gestión odontológica. El repositorio tiene dos módulos:

  - Frontend : next-dent-client/   (React + TypeScript + Tailwind CSS, Vite)
  - Backend  : next-dent-api/      (Spring Boot, Java, PostgreSQL)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO DEL PROBLEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cuando el doctor marca un tratamiento como REALIZADO desde la historia clínica
del paciente (PresupuestosTab.tsx → evolucionar), el campo `saldo_pendiente` en
`tb_presupuesto_detalle` permanece activo. Sin embargo, la página de Caja
(PagosPage.tsx) no muestra ningún aviso de que ese paciente tiene un cobro
pendiente. El recepcionista debe buscar manualmente al paciente.

El flujo correcto que hay que implementar es:

  1. Doctor marca tratamiento como REALIZADO  →  saldo_pendiente queda activo en BD
  2. Caja muestra automáticamente un panel "Por cobrar"  →  lista de pacientes
     cuyos detalles están en estado REALIZADO con saldo_pendiente > 0
  3. Al hacer click sobre un paciente en ese panel  →  se selecciona directamente
     en el buscador de Caja para proceder al cobro sin pasos extra
  4. La campana de notificaciones (Topbar.tsx) muestra el conteo de esos cobros
     pendientes junto a las citas pendientes del día

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARQUITECTURA RELEVANTE — LEE ESTOS ARCHIVOS ANTES DE TOCAR NADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lee completamente antes de escribir una sola línea de código:

  next-dent-client/src/pages/PagosPage.tsx
  next-dent-client/src/hooks/useNotificaciones.ts
  next-dent-client/src/components/Topbar.tsx
  next-dent-client/src/services/pagoService.ts
  next-dent-client/src/services/presupuestoService.ts
  next-dent-client/src/services/pacienteService.ts
  next-dent-client/src/types/pago.ts
  next-dent-client/src/types/presupuesto.ts
  next-dent-client/src/types/paciente.ts

  next-dent-api/.../controller/PagoController.java
  next-dent-api/.../controller/PresupuestoController.java
  next-dent-api/.../service/PagoService.java
  next-dent-api/.../service/PresupuestoService.java
  next-dent-api/.../repository/PresupuestoDetalleRepository.java
  next-dent-api/.../repository/PagoRepository.java

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENDPOINTS DISPONIBLES EN EL BACKEND (ya existen, no crear nuevos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  GET  /api/pacientes
       → Paciente[] con { idPac, nombre, apellido, dni, telefono, ... }

  GET  /api/pagos/paciente/{idPaciente}/deuda
       → PresupuestoDetalle[] con { idDetalle, idTarifa, precioUnitario,
         saldoPendiente, estado, numeroFdi, carasAfectadas }
       Estado puede ser: PENDIENTE | EN_PROGRESO | REALIZADO | PAGADO | ANULADO

  GET  /api/tarifario
       → Tarifario[] con { idTarifa, codigo, nombre, categoria, precio }

Los detalles que interesan para "por cobrar" son los que tienen:
  estado === 'REALIZADO'  &&  saldoPendiente > 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMBIOS REQUERIDOS — IMPLEMENTA EXACTAMENTE ESTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── CAMBIO 1: nuevo hook  src/hooks/usePorCobrar.ts ─────────────────────

Crea el hook `usePorCobrar()` que:

  a) Al montarse, carga todos los pacientes con getPacientes().
  b) Para cada paciente llama getDeudaPaciente(p.idPac) en paralelo
     con Promise.allSettled (no bloquear si uno falla).
  c) Filtra los detalles con estado === 'REALIZADO' && saldoPendiente > 0.
  d) Devuelve un array tipado:
       interface PacientePorCobrar {
         paciente: Paciente;
         detallesPendientes: DeudaDetalle[];   // solo los REALIZADO con saldo
         totalPendiente: number;               // suma de saldoPendiente
       }
  e) Hace polling cada 60 segundos (igual que useNotificaciones).
  f) Expone: { porCobrar: PacientePorCobrar[], total: number,
               loading: boolean, refresh: () => void }

  IMPORTANTE: importa DeudaDetalle desde '../services/pagoService' y
  Paciente desde '../types/paciente'. No crear tipos duplicados.

── CAMBIO 2: panel "Por cobrar" en  src/pages/PagosPage.tsx ────────────

Agrega un panel al tope del contenido (antes del buscador de paciente)
que muestre los resultados del hook usePorCobrar().

Comportamiento:
  - Si loading y aún no hay datos: skeleton de 2 filas.
  - Si porCobrar.length === 0: no renderizar nada (no mostrar panel vacío).
  - Si porCobrar.length > 0: mostrar el panel con:
      · Header: "Por cobrar" + badge con el total de pacientes + botón refresh.
      · Grid de tarjetas (máx 4 por fila en desktop, 2 en tablet).
      · Cada tarjeta muestra:
          - Avatar con iniciales del paciente (igual que en PacientesPage).
          - Nombre completo y DNI.
          - Cantidad de tratamientos pendientes de cobro.
          - Total en soles formateado (fmt function ya existe en el archivo).
          - Botón "Cobrar ahora" con color indigo.
      · Al hacer click en la tarjeta o en "Cobrar ahora":
          - Llama a seleccionarPaciente(paciente) — función que ya existe
            en PagosPage para cargar la deuda del paciente seleccionado.
          - Hace scroll suave hacia el buscador.

  Estilos: usa exclusivamente Tailwind CSS. Paleta indigo para acentos
  (igual al resto del archivo). Fondo blanco, borde border-slate-200,
  rounded-2xl. Consistente visualmente con el resto de PagosPage.

── CAMBIO 3: notificación en  src/hooks/useNotificaciones.ts ───────────

Modifica useNotificaciones() para que además de las citas pendientes del
día, también incluya notificaciones de cobros pendientes.

  a) Importa y usa usePorCobrar — NO: useNotificaciones no puede usar
     otro hook internamente. En su lugar, replica la lógica de fetch
     directamente dentro del mismo useEffect/fetchCitas.

  b) Agrega un nuevo tipo al union:
       type TipoNotificacion = 'cita_pendiente' | 'cita_confirmada' | 'cobro_pendiente'

  c) Para cada paciente con tratamientos REALIZADO + saldo > 0, crea UNA
     sola notificación (no una por tratamiento) con:
       - tipo: 'cobro_pendiente'
       - titulo: 'Cobro pendiente'
       - descripcion: `${nombre} · S/ ${totalPendiente} por cobrar`
       - hora: '00:00'  (aparece al final de la lista, después de citas)

  d) El ícono de ese tipo en Topbar.tsx (PanelNotificaciones → NotifIcon)
     debe ser un ícono de billetera o dinero, con fondo sky-100 y color
     sky-600. Agrega el case al switch/if existente en NotifIcon.

── CAMBIO 4: regla de negocio — no mostrar detalles REALIZADO como deuda
   normal en la tabla de cobro de PagosPage.tsx ─────────────────────────

Actualmente, cuando se selecciona un paciente en Caja, la tabla muestra
TODOS los detalles con saldo (PENDIENTE + EN_PROGRESO + REALIZADO).

Modifica el filtro de `lineasMapeadas` en `seleccionarPaciente` para que:
  - Los detalles con estado REALIZADO aparezcan primero en la tabla.
  - Se les agregue un badge visual "Listo para cobrar" en color emerald.
  - Los detalles con estado PENDIENTE o EN_PROGRESO aparezcan después
    con badge "En tratamiento" en color amber.
  - Los detalles PAGADO y ANULADO siguen sin mostrarse (ya es así).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESTRICCIONES — NO HACER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗ No crear ningún endpoint nuevo en el backend.
  ✗ No modificar ningún archivo Java.
  ✗ No instalar ninguna dependencia npm nueva.
  ✗ No usar localStorage ni sessionStorage.
  ✗ No reescribir lógica existente que ya funciona — solo agregar encima.
  ✗ No cambiar el diseño general de PagosPage fuera del panel nuevo.
  ✗ No tocar App.tsx, Sidebar.tsx, ni las rutas.
  ✗ No modificar pagoService.ts — los endpoints ya son correctos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDEN DE EJECUCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ejecuta en este orden para evitar errores de importación circular:

  1. Lee todos los archivos listados en "ARQUITECTURA RELEVANTE".
  2. Crea  src/hooks/usePorCobrar.ts           (Cambio 1)
  3. Modifica  src/hooks/useNotificaciones.ts  (Cambio 3)
  4. Modifica  src/components/Topbar.tsx       (Cambio 3 — ícono NotifIcon)
  5. Modifica  src/pages/PagosPage.tsx         (Cambios 2 y 4)
  6. Verifica que no haya errores de TypeScript con:
       cd next-dent-client && npx tsc --noEmit
  7. Si hay errores, corrígelos antes de terminar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESULTADO ESPERADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Al terminar:
  - `npx tsc --noEmit` pasa sin errores.
  - La página /pagos muestra el panel "Por cobrar" con los pacientes que
    tienen tratamientos REALIZADO + saldo > 0.
  - Al hacer click en un paciente del panel, se selecciona en el buscador
    y se carga su deuda automáticamente.
  - La campana en el topbar muestra las notificaciones de cobro pendiente
    junto a las citas pendientes del día.
  - En la tabla de cobro, los tratamientos REALIZADO aparecen primero con
    badge "Listo para cobrar".
