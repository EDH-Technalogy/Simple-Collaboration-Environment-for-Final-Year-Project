package com.final_project.auth_service.service;

import com.final_project.auth_service.dto.CreatePermissionRequest;
import com.final_project.auth_service.dto.PermissionDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PermissionService {

    private final KeycloakService keycloakService;
    private final AuditLogService auditLogService;

    public PermissionDTO createPermission(CreatePermissionRequest request) {
        String roleName = request.getResource().toLowerCase() + "." + request.getAction().toLowerCase();
        keycloakService.createClientRole(request.getClientId(), roleName, request.getDescription());
        auditLogService.logAuditEvent(null, "PERMISSION_CREATED", "CLIENT_ROLE", roleName, "Client role created in Keycloak for client " + request.getClientId(), "SUCCESS");
        return toDTO(request.getClientId(), keycloakService.getClientRoles(request.getClientId()).stream()
                .filter(role -> role.getName().equals(roleName))
                .findFirst()
                .orElseGet(() -> {
                    RoleRepresentation role = new RoleRepresentation();
                    role.setName(roleName);
                    role.setDescription(request.getDescription());
                    return role;
                }));
    }

    @Transactional(readOnly = true)
    public List<PermissionDTO> getPermissionsByClient(String clientId) {
        return keycloakService.getClientRoles(clientId).stream()
                .map(role -> toDTO(clientId, role))
                .toList();
    }

    public void assignPermissionToUser(String clientId, String roleName, String userId) {
        keycloakService.assignClientRoles(userId, clientId, List.of(roleName));
        auditLogService.logAuditEvent(userId, "CLIENT_ROLE_ASSIGNED", "USER", userId, "Assigned client role " + roleName + " for client " + clientId, "SUCCESS");
    }

    public void removePermissionFromUser(String clientId, String roleName, String userId) {
        keycloakService.removeClientRoles(userId, clientId, List.of(roleName));
        auditLogService.logAuditEvent(userId, "CLIENT_ROLE_REMOVED", "USER", userId, "Removed client role " + roleName + " for client " + clientId, "SUCCESS");
    }

    public void deletePermission(String clientId, String roleName) {
        keycloakService.deleteClientRole(clientId, roleName);
        auditLogService.logAuditEvent(null, "PERMISSION_DELETED", "CLIENT_ROLE", roleName, "Client role deleted from Keycloak for client " + clientId, "SUCCESS");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPermissionStatistics(String clientId) {
        List<PermissionDTO> permissions = getPermissionsByClient(clientId);
        return Map.of(
                "clientId", clientId,
                "totalPermissions", permissions.size()
        );
    }

    private PermissionDTO toDTO(String clientId, RoleRepresentation role) {
        String[] parts = role.getName() == null ? new String[0] : role.getName().split("\\.", 2);
        return PermissionDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .resource(parts.length > 0 ? parts[0] : null)
                .action(parts.length > 1 ? parts[1] : null)
                .permissionKey(clientId + ":" + role.getName())
                .isActive(true)
                .build();
    }
}
