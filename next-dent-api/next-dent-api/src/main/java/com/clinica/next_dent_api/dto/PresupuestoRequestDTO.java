package com.clinica.next_dent_api.dto;

import com.clinica.next_dent_api.model.PresupuestoDetalle;
import lombok.Data;

import java.util.List;

@Data
public class PresupuestoRequestDTO {
    private Integer idPaciente;
    private List<PresupuestoDetalle> detalles;
}
