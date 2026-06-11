package com.clinica.next_dent_api.dto;

import lombok.Data;

import java.util.List;

@Data
public class PagoRequestDTO {
    private Integer idPaciente;
    private Integer idUsuarioReceptor;
    private String medioPago;
    private String observaciones;
    private List<PagoDetalleItemDTO> detalles;
}
