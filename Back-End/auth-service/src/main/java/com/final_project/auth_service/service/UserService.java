package com.final_project.auth_service.service;

import com.final_project.auth_service.dto.*;
import com.final_project.auth_service.exception.DuplicateUserException;
import com.final_project.auth_service.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.AuthenticationException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {
    private final KeycloakService keycloakService;
    private final AuditLogService auditLogService;

    public UserDTO createUser(CreateUserRequest request) {

        if (keycloakService.findUserByUsername(request.getUsername()).isPresent()) {
            throw new DuplicateUserException("username", request.getUsername());
        }
        if (keycloakService.findUserByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateUserException("email", request.getEmail());
        }

        String userId = keycloakService.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                request.getPassword(),
                true,
                true,
                attributesFrom(request.getPhoneNumber(), request.getProfile(), request.getEntityId(), request.getUserType())
        );

        if (request.getRoleNames() != null && !request.getRoleNames().isEmpty()) {
            keycloakService.assignRealmRoles(userId, request.getRoleNames().stream().toList());
        }

        auditLogService.logAuditEvent(userId, "USER_CREATED", "USER", userId, "User created in Keycloak", "SUCCESS");
        return toDTO(keycloakService.getUserById(userId));
    }


    public void  updateProfile(String url, String id){
        UserRepresentation user = keycloakService.getUserById(id);
        if (user == null){
            throw new UserNotFoundException("User Not Found");
        }
        Map<String, List<String>> attributes = user.getAttributes();
        if (attributes == null) {
            attributes = new HashMap<>();
        }

        attributes.put("profile", List.of(url));
        user.setAttributes(attributes);
        keycloakService.updateUser(id, user);
    }
    @Transactional(readOnly = true)
    public UserDTO getUserById(String id) {
        return toDTO(keycloakService.getUserById(id));
    }

    @Transactional
    public UserDTO getUserByIdAndRoleName(String userId, String roleName) throws AuthenticationException {
        UserRepresentation user = keycloakService.getUserById(userId);
//        List<String> roles =  user.getRealmRoles().stream().filter((role) -> role.equals(roleName)).toList();
//        if (roles.isEmpty()) {
//            throw new AuthenticationException("Unauthorized Exception");
//        }
        return toDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByUsername(String username) {
        return keycloakService.findUserByUsername(username)
                .map(this::toDTO)
                .orElseThrow(() -> new UserNotFoundException("username", username));
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByEmail(String email) {
        return keycloakService.findUserByEmail(email)
                .map(this::toDTO)
                .orElseThrow(() -> new UserNotFoundException("email", email));
    }

    @Transactional(readOnly = true)
    public List<UserDTO> searchUsers(String searchTerm) {
        return searchUsers(searchTerm, UserSearchField.AUTO);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> searchUsers(String searchTerm, UserSearchField field) {
        return keycloakService.searchUsers(searchTerm, field).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllActiveUsers() {
        return keycloakService.getUsers().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAdminUsers() {
        return keycloakService.getUsers().stream()
                .filter(user -> Boolean.TRUE.equals(user.isEnabled()))
                .filter(user -> {
                    List<String> roles = keycloakService.getUserRealmRoleNames(user.getId());
                    return roles.contains("ADMIN_USER") || roles.contains("PLATFORM_ADMIN");
                })
                .map(this::toDTO)
                .toList();
    }

    public UserDTO updateUser(String userId, UpdateUserRequest request) {
        UserRepresentation user = keycloakService.getUserById(userId);
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        if (request.getEmailVerified() != null) {
            user.setEmailVerified(request.getEmailVerified());
        }

        Map<String, List<String>> attributes = user.getAttributes() == null ? new HashMap<>() : new HashMap<>(user.getAttributes());
        putAttribute(attributes, "phone_number", request.getPhoneNumber());
        putAttribute(attributes, "profile", request.getProfile());
        putAttribute(attributes, "entity_id", request.getEntityId());
        putAttribute(attributes, "user_type", request.getUserType());
        user.setAttributes(attributes);

        keycloakService.updateUser(userId, user);

        if (request.getRoleNames() != null) {
            keycloakService.replaceRealmRoles(userId, request.getRoleNames().stream().toList());
        }

        auditLogService.logAuditEvent(userId, "USER_UPDATED", "USER", userId, "User updated in Keycloak", "SUCCESS");
        return toDTO(keycloakService.getUserById(userId));
    }



    public void deleteUser(String userId) {
        keycloakService.deleteUser(userId);
        auditLogService.logAuditEvent(userId, "USER_DELETED", "USER", userId, "User deleted from Keycloak", "SUCCESS");
    }

    public void suspendUser(String userId) {
        keycloakService.setUserEnabled(userId, false);
        auditLogService.logAuditEvent(userId, "USER_SUSPENDED", "USER", userId, "User suspended in Keycloak", "SUCCESS");
    }


    public void activateUser(String userId) {
        keycloakService.setUserEnabled(userId, true);
        auditLogService.logAuditEvent(userId, "USER_ACTIVATED", "USER", userId, "User activated in Keycloak", "SUCCESS");
    }

    public void lockUser(String userId) {
        keycloakService.setUserEnabled(userId, false);
        auditLogService.logAuditEvent(userId, "USER_LOCKED", "USER", userId, "User disabled in Keycloak as a lock action", "SUCCESS");
    }

    public void verifyUserEmail(String userId) {
        keycloakService.markEmailVerified(userId, true);
        auditLogService.logAuditEvent(userId, "EMAIL_VERIFIED", "USER", userId, "Email marked verified in Keycloak", "SUCCESS");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserStatistics() {
        List<UserRepresentation> users = keycloakService.getUsers();
        long totalUsers = users.size();
        long activeUsers = users.stream().filter(user -> Boolean.TRUE.equals(user.isEnabled())).count();
        long emailVerifiedUsers = users.stream().filter(UserRepresentation::isEmailVerified).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("disabledUsers", totalUsers - activeUsers);
        stats.put("emailVerifiedUsers", emailVerifiedUsers);
        stats.put("generatedAt", LocalDateTime.now());
        return stats;
    }

    public AuthorResponse getUserAsAuthor(String id) {
        UserRepresentation user = keycloakService.getUserById(id);
        return AuthorResponse.builder()
                .id(user.getId())
                .userName(user.getUsername())
                .email(user.getEmail())
                .profile(getFirstAttribute(user, "profile"))
                .entityId(getFirstAttribute(user, "entity_id"))
                .userType(getFirstAttribute(user, "user_type"))
                .build();
    }
    public ContributorUser getContributorUser(String userId){
        UserRepresentation user = keycloakService.getUserById(userId);
        return ContributorUser
                .builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .profile(getFirstAttribute(user, "profile"))
                .build();
    }

    private UserDTO toDTO(UserRepresentation user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(getFirstAttribute(user, "phone_number"))
                .status(Boolean.TRUE.equals(user.isEnabled()) ? "ACTIVE" : "DISABLED")
                .emailVerified(user.isEmailVerified())
                .twoFactorEnabled(false)
                .roles(new java.util.LinkedHashSet<>(keycloakService.getUserRealmRoleNames(user.getId())))
                .createdAt(keycloakCreatedAt(user))
                .photoUrl(getFirstAttribute(user, "profile"))
                .build();
    }

    private LocalDateTime keycloakCreatedAt(UserRepresentation user) {
        Long createdTimestamp = user.getCreatedTimestamp();
        if (createdTimestamp != null && createdTimestamp > 0) {
            return LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(createdTimestamp),
                    ZoneId.systemDefault()
            );
        }
        String registeredAt = getFirstAttribute(user, "registered_at");
        if (registeredAt == null || registeredAt.isBlank()) {
            registeredAt = getFirstAttribute(user, "created_at");
        }
        if (registeredAt == null || registeredAt.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(registeredAt.trim());
        } catch (Exception ignored) {
            try {
                return LocalDateTime.ofInstant(
                        Instant.parse(registeredAt.trim()),
                        ZoneId.systemDefault()
                );
            } catch (Exception ignoredAgain) {
                return null;
            }
        }
    }

    private Map<String, List<String>> attributesFrom(String phoneNumber, String profile, String entityId, String userType) {
        Map<String, List<String>> attributes = new HashMap<>();
        putAttribute(attributes, "phone_number", phoneNumber);
        putAttribute(attributes, "profile", profile);
        putAttribute(attributes, "entity_id", entityId);
        putAttribute(attributes, "user_type", userType);
        return attributes;
    }

    private void putAttribute(Map<String, List<String>> attributes, String key, String value) {
        if (value == null || value.isBlank()) {
            attributes.remove(key);
            return;
        }
        attributes.put(key, List.of(value));
    }


    private String getFirstAttribute(UserRepresentation user, String key) {
        if (user.getAttributes() == null || !user.getAttributes().containsKey(key) || user.getAttributes().get(key).isEmpty()) {
            return null;
        }
        return user.getAttributes().get(key).get(0);
    }
}
