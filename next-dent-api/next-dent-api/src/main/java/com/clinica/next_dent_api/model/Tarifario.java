package com.clinica.next_dent_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_tarifario")
public class Tarifario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idTarifa;

    private String codigo;

    private String nombre;

    private String categoria;

    private BigDecimal precio;

    private Boolean estado;
}
