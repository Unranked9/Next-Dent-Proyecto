package com.clinica.next_dent_api.dto;

public class UsuarioResponseDTO {

    private Long idUsuario;
    private String email;
    private String rol;
    private boolean activo;
    private Integer idDoctor; // null si el usuario no es DOCTOR

    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public Integer getIdDoctor() { return idDoctor; }
    public void setIdDoctor(Integer idDoctor) { this.idDoctor = idDoctor; }
}
