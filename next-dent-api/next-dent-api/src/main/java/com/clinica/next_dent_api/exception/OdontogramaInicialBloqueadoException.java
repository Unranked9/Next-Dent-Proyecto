package com.clinica.next_dent_api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class OdontogramaInicialBloqueadoException extends RuntimeException {

    public OdontogramaInicialBloqueadoException(Integer idPaciente) {
        super("El paciente " + idPaciente + " ya tiene tratamientos REALIZADOS. "
              + "Modificar el odontograma INICIAL puede comprometer la historia clínica legal. "
              + "Confirme la operación con ?forzar=true.");
    }
}
