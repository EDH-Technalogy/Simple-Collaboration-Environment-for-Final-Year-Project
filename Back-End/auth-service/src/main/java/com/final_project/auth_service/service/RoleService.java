package com.final_project.auth_service.service;

import com.final_project.auth_service.dto.CreateRoleRequest;
import com.final_project.auth_service.dto.RoleDTO;
import com.final_project.auth_service.dto.UpdateRoleRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoleService {

    private final KeycloakService keycloakService;
    private final AuditLogService auditLogService;

    public RoleDTO createRole(CreateRoleRequest request) {
        keycloakService.createRealmRole(request.getName(), request.getDescription());
        auditLogService.logAuditEvent(null, "ROLE_CREATED", "ROLE", request.getName(), "Realm role created in Keycloak", "SUCCESS");
        return toDTO(keycloakService.getRealmRole(request.getName()));
    }

    @Transactional(readOnly = true)
    public List<RoleDTO> getAllRoles() {
        return keycloakService.getRealmRoles().stream().map(this::toDTO).toList();
    }

    public RoleDTO getRole(String clientId,String role) {
        return toDTO(keycloakService.getClientRole(clientId,role));
    }
    public RoleDTO updateRole(String roleName, UpdateRoleRequest request) {
        keycloakService.updateRealmRole(roleName, request.getName(), request.getDescription());
        String resolvedName = request.getName() != null && !request.getName().isBlank() ? request.getName() : roleName;
        auditLogService.logAuditEvent(null, "ROLE_UPDATED", "ROLE", resolvedName, "Realm role updated in Keycloak", "SUCCESS");
        return toDTO(keycloakService.getRealmRole(resolvedName));
    }

    public void deleteRole(String roleName) {
        keycloakService.deleteRealmRole(roleName);
        auditLogService.logAuditEvent(null, "ROLE_DELETED", "ROLE", roleName, "Realm role deleted from Keycloak", "SUCCESS");
    }

    public void assignRoleToUser(String roleName, String userId) {
        keycloakService.assignRealmRoles(userId, List.of(roleName));
        auditLogService.logAuditEvent(userId, "ROLE_ASSIGNED", "USER", userId, "Assigned realm role " + roleName, "SUCCESS");
    }

    public void removeRoleFromUser(String roleName, String userId) {
        keycloakService.removeRealmRoles(userId, List.of(roleName));
        auditLogService.logAuditEvent(userId, "ROLE_REMOVED", "USER", userId, "Removed realm role " + roleName, "SUCCESS");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRoleStatistics() {
        List<RoleDTO> roles = getAllRoles();
        return Map.of(
                "totalRoles", roles.size(),
                "activeRoles", roles.size()
        );
    }

    private RoleDTO toDTO(RoleRepresentation role) {
        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .isActive(true)
                .permissions(new LinkedHashSet<>())
                .build();
    }
}
