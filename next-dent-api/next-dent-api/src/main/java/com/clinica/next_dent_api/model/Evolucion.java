package com.clinica.next_dent_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_evolucion")
public class Evolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evolucion")
    private Integer idEvolucion;

    @Column(name = "id_paciente")
    private Integer idPaciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_doc")
    private Doctor doctor;

    @Column(name = "numero_fdi")
    private Integer numeroFdi;

    private String fecha;

    @Column(columnDefinition = "TEXT")
    private String descripcion;
}
