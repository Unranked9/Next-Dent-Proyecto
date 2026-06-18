package com.clinica.next_dent_api.dto;

public class UsuarioRequestDTO {

    private String email;
    private String password; // null en UPDATE significa "no cambiar"
    private String rol;
    private boolean activo;
    private Integer idDoctor; // nullable — solo aplica si rol == "DOCTOR"

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public Integer getIdDoctor() { return idDoctor; }
    public void setIdDoctor(Integer idDoctor) { this.idDoctor = idDoctor; }
}
