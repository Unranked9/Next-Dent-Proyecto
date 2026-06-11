package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.model.Tarifario;
import com.clinica.next_dent_api.repository.TarifarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TarifarioService {

    @Autowired
    private TarifarioRepository tarifarioRepository;

    // Aquí está el método que faltaba
    public List<Tarifario> obtenerActivos() {
        return tarifarioRepository.findByEstadoTrue();
    }

    public Tarifario guardar(Tarifario tarifario) {
        tarifario.setEstado(true); // Aseguramos que nazca activo
        return tarifarioRepository.save(tarifario);
    }

    public Tarifario actualizar(Integer id, Tarifario tarifarioActualizado) {
        return tarifarioRepository.findById(id).map(tarifa -> {
            tarifa.setCodigo(tarifarioActualizado.getCodigo());
            tarifa.setNombre(tarifarioActualizado.getNombre());
            tarifa.setCategoria(tarifarioActualizado.getCategoria());
            tarifa.setPrecio(tarifarioActualizado.getPrecio());
            return tarifarioRepository.save(tarifa);
        }).orElseThrow(() -> new RuntimeException("Tarifa no encontrada"));
    }

    public void eliminar(Integer id) {
        // En lugar de borrarlo de MySQL, solo lo ocultamos (Soft Delete)
        // para no romper los presupuestos históricos que ya lo usan
        tarifarioRepository.findById(id).ifPresent(tarifa -> {
            tarifa.setEstado(false);
            tarifarioRepository.save(tarifa);
        });
    }
}