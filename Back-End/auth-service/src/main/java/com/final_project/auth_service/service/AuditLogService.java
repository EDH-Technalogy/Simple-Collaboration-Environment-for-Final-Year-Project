package com.final_project.auth_service.service;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@AllArgsConstructor
public class AuditLogService {

    @Async
    public void logAuditEvent(String userId, String action, String entityType, String entityId, String description, String status) {
        logAuditEvent(userId, action, entityType, entityId, description, null, null, status);
    }

    @Async
    public void logAuditEvent(String userId,
                              String action,
                              String entityType,
                              String entityId,
                              String description,
                              String oldValue,
                              String newValue,
                              String status) {
        log.info("AUDIT action={} status={} userId={} entityType={} entityId={} description={} oldValue={} newValue={}",
                action, status, userId, entityType, entityId, description, oldValue, newValue);
    }
}
