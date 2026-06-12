package com.clinica.next_dent_api.dto;

import java.math.BigDecimal;

public class PagoPorDiaDTO {

    private String fecha;
    private BigDecimal monto;
    private int cantidadPagos;

    public PagoPorDiaDTO(String fecha, BigDecimal monto, int cantidadPagos) {
        this.fecha = fecha;
        this.monto = monto;
        this.cantidadPagos = cantidadPagos;
    }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public int getCantidadPagos() { return cantidadPagos; }
    public void setCantidadPagos(int cantidadPagos) { this.cantidadPagos = cantidadPagos; }
}
