package com.clinica.next_dent_api.dto;

import lombok.Data;

@Data
public class EvolucionRequestDTO {

    private Integer idDoctor;
    private String notaClinica;
    private Boolean finalizado;
}
