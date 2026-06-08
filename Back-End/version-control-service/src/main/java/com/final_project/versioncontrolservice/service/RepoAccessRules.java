package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.model.ContributorStatus;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import org.springframework.util.StringUtils;

public final class RepoAccessRules {

    private RepoAccessRules() {}

    public static boolean canRead(RepositoryDocument meta, String usernameOrEmpty) {
        String visibility = meta.getVisibility() == null ? "" : meta.getVisibility().toString();
        if ("public".equalsIgnoreCase(StringUtils.trimWhitespace(visibility))) {
            return true;
        }
        String u = norm(usernameOrEmpty);
        if (u.isEmpty()) {
            return false;
        }
        if (meta.getOwner() != null && meta.getOwner().getUsername().equalsIgnoreCase(u)) {
            return true;
        }
        String role = collaboratorRole(meta, u);
        return "read".equals(role) || "write".equals(role) || "admin".equals(role);
    }

    public static boolean canWrite(RepositoryDocument meta, String username) {
        String u = norm(username);
        if (u.isEmpty()) {
            return false;
        }
        if (meta.getOwner() != null && meta.getOwner().getUsername().equalsIgnoreCase(u)) {
            return true;
        }
        String role = collaboratorRole(meta, u);
        return "write".equals(role) || "admin".equals(role);
    }

    public static boolean canAdmin(RepositoryDocument meta, String username) {
        String u = norm(username);
        if (u.isEmpty()) {
            return false;
        }
        if (meta.getOwner() != null && meta.getOwner().getUsername().equalsIgnoreCase(u)) {
            return true;
        }
        return "admin".equals(collaboratorRole(meta, u));
    }

    public static boolean isOwnerOrAcceptedCollaborator(RepositoryDocument meta, String username) {
        String u = norm(username);
        if (u.isEmpty()) {
            return false;
        }
        if (meta.getOwner() != null && meta.getOwner().getUsername().equalsIgnoreCase(u)) {
            return true;
        }
        return !collaboratorRole(meta, u).isEmpty();
    }

    private static String collaboratorRole(RepositoryDocument meta, String usernameLower) {
        if (meta.getCollaborators() == null) {
            return "";
        }
        for (ContributorUser c : meta.getCollaborators()) {
            if (c.getUsername() != null && c.getUsername().trim().equalsIgnoreCase(usernameLower)) {
                ContributorStatus status = c.getContributorStatus();
                if (status != null && status != ContributorStatus.ACCEPTED) {
                    return "";
                }
                String role = c.getRole() == null ? "" : c.getRole().trim().toLowerCase();
                return role.isEmpty() ? "read" : role;
            }
        }
        return "";
    }

    private static String norm(String u) {
        return u == null ? "" : u.trim().toLowerCase();
    }
}
