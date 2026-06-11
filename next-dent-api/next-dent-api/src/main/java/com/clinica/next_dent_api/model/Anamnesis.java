package com.clinica.next_dent_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_anamnesis")
public class Anamnesis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_anamnesis")
    private Integer idAnamnesis;

    @Column(name = "id_paciente")
    private Integer idPaciente;

    @Column(name = "id_ciclo")
    private Integer idCiclo;

    @Column(name = "respuestas_json", columnDefinition = "TEXT")
    private String respuestasJson;
}