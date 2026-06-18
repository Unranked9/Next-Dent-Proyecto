package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.dto.UsuarioRequestDTO;
import com.clinica.next_dent_api.dto.UsuarioResponseDTO;
import com.clinica.next_dent_api.model.Doctor;
import com.clinica.next_dent_api.model.Usuario;
import com.clinica.next_dent_api.repository.DoctorRepository;
import com.clinica.next_dent_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UsuarioResponseDTO crear(UsuarioRequestDTO dto) {
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email ya registrado");
        }
        Usuario u = new Usuario();
        u.setEmail(dto.getEmail());
        u.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        u.setRol(dto.getRol());
        u.setActivo(dto.isActivo());
        u.setDoctor(resolverDoctor(dto.getIdDoctor()));
        return toResponse(usuarioRepository.save(u));
    }

    public UsuarioResponseDTO actualizar(Long id, UsuarioRequestDTO dto) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (!u.getEmail().equalsIgnoreCase(dto.getEmail()) && usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email ya registrado");
        }

        u.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }
        u.setRol(dto.getRol());
        u.setActivo(dto.isActivo());
        u.setDoctor(resolverDoctor(dto.getIdDoctor()));
        return toResponse(usuarioRepository.save(u));
    }

    public void eliminar(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        usuarioRepository.deleteById(id);
    }

    private Doctor resolverDoctor(Integer idDoctor) {
        if (idDoctor == null) return null;
        return doctorRepository.findById(idDoctor)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor no encontrado: " + idDoctor));
    }

    private UsuarioResponseDTO toResponse(Usuario u) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.setIdUsuario(u.getIdUsuario());
        dto.setEmail(u.getEmail());
        dto.setRol(u.getRol());
        dto.setActivo(u.isActivo());
        dto.setIdDoctor(u.getDoctor() != null ? u.getDoctor().getIdDoc() : null);
        return dto;
    }
}
