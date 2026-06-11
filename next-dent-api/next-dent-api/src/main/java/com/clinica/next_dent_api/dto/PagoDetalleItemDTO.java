package com.clinica.next_dent_api.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PagoDetalleItemDTO {
    private Integer idPresupuestoDetalle;
    private BigDecimal montoAbonar;
}
