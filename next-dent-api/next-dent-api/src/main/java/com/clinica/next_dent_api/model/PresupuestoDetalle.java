package com.clinica.next_dent_api.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_presupuesto_detalle")
public class PresupuestoDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle")
    private Integer idDetalle;

    @Column(name = "numero_fdi")
    private Integer numeroFdi;

    @Column(name = "id_tarifa", nullable = false)
    private Integer idTarifa;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "saldo_pendiente", nullable = false, precision = 10, scale = 2)
    private BigDecimal saldoPendiente;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "PENDIENTE";

    /**
     * Superficies dentales afectadas por este tratamiento, separadas por coma.
     * Códigos: V (vestibular), L (lingual), M (mesial), D (distal), O (oclusal).
     * Null indica tratamiento de diente completo (ej: extracción, corona).
     */
    @Column(name = "caras_afectadas", length = 20)
    private String carasAfectadas;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_presupuesto", nullable = false)
    private Presupuesto presupuesto;

    @Column(name = "motivo_anulacion")
    private String motivoAnulacion;
}
