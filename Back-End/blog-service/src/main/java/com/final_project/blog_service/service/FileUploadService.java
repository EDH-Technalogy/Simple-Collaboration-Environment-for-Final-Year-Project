package com.final_project.blog_service.service;
import com.final_project.blog_service.client.FileServiceClient;
import com.final_project.blog_service.dto.response.FileUploadResponse;
import com.final_project.blog_service.exception.FileUploadException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {
    private final FileServiceClient fileServiceClient;
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    private static final long MAX_VIDEO_SIZE = 500 * 1024 * 1024;

    private static final Set<String> IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final Set<String> VIDEO_TYPES = Set.of(
            "video/mp4", "video/webm", "video/ogg", "video/quicktime"
    );

    public FileUploadResponse uploadArticleImage(MultipartFile file ,String authorId, String articleId) {
        validate(file, IMAGE_TYPES, MAX_IMAGE_SIZE, "image");
        return upload(file, authorId, articleId, "image");
    }
    public FileUploadResponse uploadArticleVideo(MultipartFile file, String authorId, String articleId) {
        validate(file, VIDEO_TYPES, MAX_VIDEO_SIZE, "video");
        return upload(file, authorId, articleId, "video");
    }
    private FileUploadResponse upload(MultipartFile file, String authorId, String articleId, String subFolder) {
        try {
            return fileServiceClient.uploadBlogFile(
                    file,
                    authorId,
                    articleId != null ? articleId : "drafts"
            );

        } catch (Exception ex) {
            log.error("File-service upload failed", ex);
            throw new FileUploadException("Failed to upload " + subFolder + " file");
        }
    }

    public void deleteFile(String fileId, String articleId) {
        try {
            fileServiceClient.deleteFile(fileId, articleId);
        } catch (Exception ex) {
            log.warn("Failed to delete file {} from file-service", fileId, ex);
        }
    }

    private void validate(MultipartFile file, Set<String> allowedTypes, long maxSize, String label) {
        if (file == null || file.isEmpty()) {
            throw new FileUploadException(label + " file is required");
        }

        if (file.getSize() > maxSize) {
            throw new FileUploadException(label + " file is too large");
        }

        if (file.getContentType() == null || !allowedTypes.contains(file.getContentType())) {
            throw new FileUploadException("Unsupported " + label + " type: " + file.getContentType());
        }

        String filename = file.getOriginalFilename();
        if (    filename == null
                || filename.contains("..")
                || filename.contains("/")
        ) {
            throw new FileUploadException("Invalid filename");
        }

    }

}
