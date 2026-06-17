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
@Table(name = "tb_pago_detalle")
public class PagoDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago_detalle")
    private Integer idPagoDetalle;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pago", nullable = false)
    private Pago pago;

    @Column(name = "id_presupuesto_detalle", nullable = false)
    private Integer idPresupuestoDetalle;

    @Column(name = "monto_aplicado", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoAplicado;

    @Column(name = "concepto", length = 300)
    private String concepto;
}
