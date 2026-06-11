package com.clinica.next_dent_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_diente_estado")
public class DienteEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_registro")
    private Integer idRegistro;

    @Column(name = "id_odontograma")
    private Integer idOdontograma;

    @Column(name = "numero_fdi")
    private Integer numeroFdi;

    @Column(name = "condicion_general")
    private String condicionGeneral;

    @Column(name = "sup_vestibular")
    private String supVestibular;

    @Column(name = "sup_lingual")
    private String supLingual;

    @Column(name = "sup_mesial")
    private String supMesial;

    @Column(name = "sup_distal")
    private String supDistal;

    @Column(name = "sup_oclusal")
    private String supOclusal;

    @Column(name = "sigla_recuadro")
    private String siglaRecuadro;

    @Column(name = "color_recuadro")
    private String colorRecuadro;

    @Column(name = "trazo_raiz")
    private String trazoRaiz;

    @Column(name = "trazo_corona")
    private String trazoCorona;

    @Column(name = "trazo_externo")
    private String trazoExterno;

    private String notas;

    @Column(name = "estado_salud")
    private String estadoSalud;

    @Column(name = "estado_clinico")
    private String estadoClinico;
}
