package com.clinica.next_dent_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvolucionHistorialDTO {

    private Integer idEvolucion;
    private String fecha;
    private String descripcion;
    private String nombreDoctor;
    private Integer numeroFdi;
}
