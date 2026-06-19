# Next Dent — Prompt #14: Panel lateral colapsable en PresupuestosTab

## Contexto
El panel lateral del tarifario en `PresupuestosTab.tsx` actualmente usa un grid de dos columnas
que requiere ancho >= 1024px para activarse. En laptops con escala de sistema 150% (común en
pantallas pequeñas), el ancho efectivo es ~850px y el panel nunca aparece al lado — se va debajo
del odontograma y queda cortado.

## Solución
Convertir el panel lateral en un **drawer flotante** que aparece superpuesto sobre el odontograma
cuando el usuario hace clic en un diente. Funciona en cualquier ancho de pantalla.

---

## Cambios en `next-dent-client/src/components/PresupuestosTab.tsx`

### PASO 1 — Leer el archivo completo primero
```bash
cat next-dent-client/src/components/PresupuestosTab.tsx
```

### PASO 2 — Cambiar el layout del workspace (línea ~426)

**Reemplazar:**
```tsx
{/* Body: Odontograma + panel lateral */}
<div className="p-4">
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-5 items-start">

    {/* ── Odontograma (centro visual interactivo) ── */}
    <div className="relative">
```

**Por:**
```tsx
{/* Body: Odontograma + panel lateral drawer */}
<div className="p-4">
  <div className="relative">

    {/* ── Odontograma (centro visual interactivo) ── */}
    <div className="relative">
```

### PASO 3 — Convertir el panel lateral en drawer flotante (línea ~452)

**Reemplazar desde** `{/* ── Panel lateral: Tarifario (visible cuando hay piezaActiva) ── */}`
**hasta** `</div>` que cierra el grid (línea ~538), **por:**

```tsx
            {/* ── Drawer flotante: Tarifario ── */}
            {piezaActiva && (
              <>
                {/* Overlay semitransparente — click fuera cierra */}
                <div
                  className="absolute inset-0 z-20 bg-black/10 rounded-xl"
                  onClick={() => setPiezaActiva(null)}
                />

                {/* Panel drawer */}
                <div className="absolute top-0 right-0 z-30 h-full w-full sm:w-[340px] bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">

                  {/* Cabecera: pieza seleccionada */}
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-blue-50 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
                      {piezaActiva.fdi}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 leading-tight">
                        Pieza {piezaActiva.fdi} — Selecciona un procedimiento
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        El tratamiento se añadirá al presupuesto
                      </p>
                    </div>
                    <button
                      onClick={() => setPiezaActiva(null)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Cerrar panel"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Buscador del tarifario */}
                  <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre, código o categoría..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Lista del tarifario */}
                  <div className="overflow-y-auto flex-1 p-3 space-y-0.5">
                    {tarifas.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : tarifasFiltradas.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        Sin resultados para &ldquo;{busqueda}&rdquo;
                      </p>
                    ) : busqueda.trim() ? (
                      tarifasFiltradas.map((t) => (
                        <TarifaRow key={t.idTarifa} tarifa={t} onAdd={handleAgregarTratamiento} />
                      ))
                    ) : (
                      categorias.map((cat) => (
                        <div key={cat}>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5 sticky top-0 bg-white z-10">
                            {cat}
                          </p>
                          {tarifas
                            .filter((t) => t.categoria === cat)
                            .map((t) => (
                              <TarifaRow key={t.idTarifa} tarifa={t} onAdd={handleAgregarTratamiento} />
                            ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
```

> ⚠️ Verificar que el `</div>` de cierre del workspace queda correctamente cerrado.
> El drawer usa `absolute` sobre el odontograma, no ocupa espacio en el layout.
> El overlay cierra el drawer al hacer clic fuera del panel.

### PASO 4 — Verificar y commitear

```bash
cd next-dent-client
npx tsc --noEmit
```

Si no hay errores:

```bash
git add next-dent-client/src/components/PresupuestosTab.tsx
git commit -m "feat: panel tarifario como drawer flotante en PresupuestosTab"
git push origin main
```
