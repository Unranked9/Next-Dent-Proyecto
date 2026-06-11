package com.clinica.next_dent_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO que transporta tratamientos dentales que abarcan rangos de piezas (como Prótesis Fijas
 * o Diastemas) desde el backend hacia el Frontend, sin lógica de persistencia.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OdontogramaMultipiezaDTO {

    private Integer idMultipieza;
    private Integer idOdontograma;
    private String tipoTratamiento;
    private String color;
    private Integer piezaInicio;
    private Integer piezaFin;
    private String notas;
}
