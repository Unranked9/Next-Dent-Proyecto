package com.clinica.next_dent_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EvolucionResponseDTO {

    private boolean exito;
    private String mensaje;
    private Integer idEvolucion;
}
