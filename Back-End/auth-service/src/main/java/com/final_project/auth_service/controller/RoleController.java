package com.final_project.auth_service.controller;

import com.final_project.auth_service.dto.CreateRoleRequest;
import com.final_project.auth_service.dto.RoleDTO;
import com.final_project.auth_service.dto.UpdateRoleRequest;
import com.final_project.auth_service.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Role Management", description = "Realm role management endpoints")
@SecurityRequirement(name = "Bearer Token")
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Create realm role")
    public ResponseEntity<RoleDTO> createRole(@Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.createRole(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "List realm roles")
    public ResponseEntity<Map<String, Object>> getAllRoles() {
        List<RoleDTO> roles = roleService.getAllRoles();
        Map<String, Object> response = new HashMap<>();
        response.put("total", roles.size());
        response.put("roles", roles);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{roleName}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Update realm role")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable String roleName, @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(roleService.updateRole(roleName, request));
    }

    @DeleteMapping("/{roleName}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Delete realm role")
    public ResponseEntity<Void> deleteRole(@PathVariable String roleName) {
        roleService.deleteRole(roleName);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{roleName}/assign-to-user/{userId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Assign realm role to user")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Role assigned successfully"))
    public ResponseEntity<Map<String, String>> assignRoleToUser(@PathVariable String roleName, @PathVariable String userId) {
        roleService.assignRoleToUser(roleName, userId);
        return ResponseEntity.ok(Map.of("message", "Role assigned successfully", "status", "success"));
    }

    @DeleteMapping("/{roleName}/remove-from-user/{userId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Remove realm role from user")
    public ResponseEntity<Map<String, String>> removeRoleFromUser(@PathVariable String roleName, @PathVariable String userId) {
        roleService.removeRoleFromUser(roleName, userId);
        return ResponseEntity.ok(Map.of("message", "Role removed successfully", "status", "success"));
    }

    @GetMapping("/stats/count")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'ADMIN_USER')")
    @Operation(summary = "Realm role statistics")
    public ResponseEntity<Map<String, Object>> getRoleStats() {
        return ResponseEntity.ok(roleService.getRoleStatistics());
    }
}
