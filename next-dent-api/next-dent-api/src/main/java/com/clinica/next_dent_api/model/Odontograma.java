package com.clinica.next_dent_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_odontograma")
public class Odontograma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_odontograma")
    private Integer idOdontograma;

    @Column(name = "id_paciente")
    private Integer idPaciente;

    @Column(name = "fecha_actualizacion")
    private String fechaActualizacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 10)
    private TipoOdontograma tipo;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "id_ciclo")
    private Integer idCiclo;
}
