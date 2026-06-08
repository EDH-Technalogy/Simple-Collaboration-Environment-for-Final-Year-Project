package com.final_project.file_service.infrastructure.stradegy;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.BucketStrategy;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UniversalBucketStrategy implements BucketStrategy {

    @Override
    public String resolveBucket(FileMetadata m) {
        if (m.getCategory() == FileCategory.BLOG) return "blogs";
        if (m.getCategory() == FileCategory.CLI_APPLICATION) return "cli-applications";

        switch (m.getOwnerType()) {
            case UNIVERSITY:
            case FACULTY:
            case DEPARTMENT:
                return "university-core";
            default:
                return "user-content";
        }
    }

    @Override
    public String resolveKey(FileMetadata m) {

        if (m.getCategory() == FileCategory.BLOG) {
            return "user/" + m.getOwnerId() + "/" + m.getSubFolder() + "/" + uniqueFileName(m.getFileName());
        }
        if (m.getCategory() == FileCategory.CLI_APPLICATION) {
            String folder = m.getSubFolder() == null || m.getSubFolder().isBlank()
                    ? "latest"
                    : safePathPart(m.getSubFolder());
            return folder + "/" + safePathPart(m.getFileName());
        }
        if (isUser(m.getOwnerType())) {
            String base = m.getOwnerType().name().toLowerCase() + "/" + m.getOwnerId() + "/";

            switch (m.getCategory()) {
                case PROFILE:
                    return base + "profile/" + m.getFileName();
                case DOCUMENT:
                    return base + "documents/" + m.getFileName();
                case EVENT:
                    return base + "events/" + m.getSubFolder() + "/" + m.getFileName();
                case PRIVATE:
                    return base + "private/" + m.getFileName();
                case LOGO:
                    return base + "logo/" + m.getFileName();
                default:
                    return base + "misc/" + m.getFileName();
            }
        }
        return "university/" + m.getOwnerId() + "/" + m.getCategory().name().toLowerCase() + "/" + m.getFileName();
    }

    private String uniqueFileName(String fileName) {
        String safeName = fileName == null || fileName.isBlank()
                ? "file"
                : safePathPart(fileName);
        return UUID.randomUUID() + "-" + safeName;
    }

    private String safePathPart(String value) {
        return value == null || value.isBlank()
                ? "file"
                : value.replace("\\", "-").replace("/", "-");
    }

    private boolean isUser(OwnerType type) {
        return type == OwnerType.STUDENT ||
                type == OwnerType.TEACHER ||
                type == OwnerType.EMPLOYEE ||
                type == OwnerType.ADMIN ||
                type == OwnerType.USER;
    }
}
