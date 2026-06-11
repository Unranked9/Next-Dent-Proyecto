-- ============================================================
-- MIGRACIÓN: Agregar saldo_pendiente a tb_presupuesto_detalle
-- Ejecutar manualmente en db_clinica_dental
-- ============================================================

-- 1. Agregar la nueva columna (DEFAULT 0 para pasar la restricción NOT NULL)
ALTER TABLE tb_presupuesto_detalle
    ADD COLUMN saldo_pendiente DECIMAL(10,2) NOT NULL DEFAULT 0.00
        AFTER precio_unitario;

-- 2. Para registros ya PAGADOS: saldo queda en 0
UPDATE tb_presupuesto_detalle
SET saldo_pendiente = 0.00
WHERE estado = 'PAGADO';

-- 3. Para el resto: saldo = precio_unitario - lo que ya se pagó via tb_pago_detalle
UPDATE tb_presupuesto_detalle pd
SET pd.saldo_pendiente = pd.precio_unitario - COALESCE(
    (SELECT SUM(pdet.monto_aplicado)
     FROM tb_pago_detalle pdet
     WHERE pdet.id_presupuesto_detalle = pd.id_detalle),
    0.00
)
WHERE pd.estado != 'PAGADO';

-- 4. Corregir negativos por inconsistencias de datos previas
UPDATE tb_presupuesto_detalle
SET saldo_pendiente = 0.00
WHERE saldo_pendiente < 0;

-- 5. Marcar como CON_SALDO los que tienen pago parcial registrado
UPDATE tb_presupuesto_detalle
SET estado = 'CON_SALDO'
WHERE estado = 'PENDIENTE'
  AND saldo_pendiente < precio_unitario
  AND saldo_pendiente > 0;
