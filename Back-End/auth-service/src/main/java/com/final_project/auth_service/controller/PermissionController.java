package com.final_project.auth_service.controller;

import com.final_project.auth_service.dto.CreatePermissionRequest;
import com.final_project.auth_service.dto.PermissionDTO;
import com.final_project.auth_service.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Permission Management", description = "Keycloak client-role permission endpoints")
@SecurityRequirement(name = "Bearer Token")
public class PermissionController {

    private final PermissionService permissionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Create client role permission")
    public ResponseEntity<PermissionDTO> createPermission(@Valid @RequestBody CreatePermissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(permissionService.createPermission(request));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'OPERATOR', 'ADMIN_USER')")
    @Operation(summary = "List permissions for a client")
    public ResponseEntity<Map<String, Object>> getPermissionsByClient(@PathVariable String clientId) {
        List<PermissionDTO> permissions = permissionService.getPermissionsByClient(clientId);
        Map<String, Object> response = new HashMap<>();
        response.put("clientId", clientId);
        response.put("total", permissions.size());
        response.put("permissions", permissions);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/client/{clientId}/role/{roleName}/assign-to-user/{userId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Assign client role permission to user")
    public ResponseEntity<Map<String, String>> assignPermissionToUser(@PathVariable String clientId,
                                                                      @PathVariable String roleName,
                                                                      @PathVariable String userId) {
        permissionService.assignPermissionToUser(clientId, roleName, userId);
        return ResponseEntity.ok(Map.of("message", "Permission assigned successfully", "status", "success"));
    }

    @DeleteMapping("/client/{clientId}/role/{roleName}/remove-from-user/{userId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Remove client role permission from user")
    public ResponseEntity<Map<String, String>> removePermissionFromUser(@PathVariable String clientId,
                                                                        @PathVariable String roleName,
                                                                        @PathVariable String userId) {
        permissionService.removePermissionFromUser(clientId, roleName, userId);
        return ResponseEntity.ok(Map.of("message", "Permission removed successfully", "status", "success"));
    }

    @DeleteMapping("/client/{clientId}/role/{roleName}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Delete client role permission")
    public ResponseEntity<Void> deletePermission(@PathVariable String clientId, @PathVariable String roleName) {
        permissionService.deletePermission(clientId, roleName);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/client/{clientId}/stats/count")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Permission statistics by client")
    public ResponseEntity<Map<String, Object>> getPermissionStats(@PathVariable String clientId) {
        return ResponseEntity.ok(permissionService.getPermissionStatistics(clientId));
    }
}
