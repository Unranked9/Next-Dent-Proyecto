package com.clinica.next_dent_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_odontograma_multipieza")
public class OdontogramaMultipieza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_multipieza")
    private Integer idMultipieza;

    @Column(name = "id_odontograma")
    private Integer idOdontograma;

    @Column(name = "tipo_tratamiento")
    private String tipoTratamiento;

    private String color;

    @Column(name = "pieza_inicio")
    private Integer piezaInicio;

    @Column(name = "pieza_fin")
    private Integer piezaFin;

    private String notas;
}