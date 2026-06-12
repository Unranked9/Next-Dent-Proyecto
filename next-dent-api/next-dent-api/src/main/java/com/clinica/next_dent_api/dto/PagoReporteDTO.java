package com.clinica.next_dent_api.dto;

import java.math.BigDecimal;
import java.util.List;

public class PagoReporteDTO {

    private BigDecimal totalPeriodo;
    private int totalPagos;
    private List<PagoPorDiaDTO> porDia;

    public PagoReporteDTO(BigDecimal totalPeriodo, int totalPagos, List<PagoPorDiaDTO> porDia) {
        this.totalPeriodo = totalPeriodo;
        this.totalPagos = totalPagos;
        this.porDia = porDia;
    }

    public BigDecimal getTotalPeriodo() { return totalPeriodo; }
    public void setTotalPeriodo(BigDecimal totalPeriodo) { this.totalPeriodo = totalPeriodo; }

    public int getTotalPagos() { return totalPagos; }
    public void setTotalPagos(int totalPagos) { this.totalPagos = totalPagos; }

    public List<PagoPorDiaDTO> getPorDia() { return porDia; }
    public void setPorDia(List<PagoPorDiaDTO> porDia) { this.porDia = porDia; }
}
