package com.restaurante.aspect;

import com.restaurante.entity.Auditoria;
import com.restaurante.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditoriaHelperService {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Auditoria guardarAuditoria(Auditoria auditoria) {
        return auditoriaRepository.save(auditoria);
    }
}
