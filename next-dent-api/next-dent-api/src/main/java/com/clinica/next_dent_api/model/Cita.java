package com.clinica.next_dent_api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_cita")
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Integer idCita;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_pac")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Paciente paciente;

    @Column(name = "id_doc")
    private Integer idDoc;

    @Column(name = "id_tra")
    private Integer idTra;

    private String fecha;

    private String hora;

    private String estado;

    @Column(name = "motivo")
    private String motivo;

    @Column(name = "notas")
    private String notas;
}
