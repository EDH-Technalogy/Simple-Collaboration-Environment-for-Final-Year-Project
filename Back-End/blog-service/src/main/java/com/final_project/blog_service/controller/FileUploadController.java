package com.final_project.blog_service.controller;

import com.final_project.blog_service.dto.response.FileUploadResponse;
import com.final_project.blog_service.dto.response.ImageUploadResponse;
import com.final_project.blog_service.dto.response.VideoUploadResponse;
import com.final_project.blog_service.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * File Upload Controller
 *
 * Handles file uploads for article content
 * Supports images, videos, and other media files
 * Integrates with File Service (MinIO)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Tag(
        name = "File Uploads",
        description = "File upload endpoints for article content (images, videos, etc.)"
)
public class FileUploadController {

    private final FileUploadService fileUploadService;

    /**
     * Upload an image file
     */
    @PostMapping(value = "/upload/image/{userId}/article/{articleId}", consumes = "multipart/form-data")
    @Operation(
            summary = "Upload image",
            description = "Uploads an image file for use in article content blocks. Supports JPEG, PNG, WebP, GIF.",
            tags = {"File Uploads"},
            operationId = "uploadImage"
    )
    @Parameters({
            @Parameter(
                    name = "file",
                    description = "Image file (JPEG, PNG, WebP, GIF). Max size: 10MB",
                    required = true,
                    in = ParameterIn.QUERY
            ),
            @Parameter(
                    name = "alt",
                    description = "Alternative text for accessibility",
                    required = false,
                    in = ParameterIn.QUERY
            ),
            @Parameter(
                    name = "caption",
                    description = "Image caption",
                    required = false,
                    in = ParameterIn.QUERY
            )
    })
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Image uploaded successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ImageUploadResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid file or parameters"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT missing"
            ),
            @ApiResponse(
                    responseCode = "413",
                    description = "File too large (max 10MB)"
            ),
            @ApiResponse(
                    responseCode = "415",
                    description = "Unsupported media type"
            )
    })
    public ResponseEntity<FileUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @PathVariable String userId,
            @PathVariable String articleId

    ) {
        log.info("POST /api/v1/files/upload/image - Upload image");

        FileUploadResponse response = fileUploadService.uploadArticleImage(file,userId,articleId );

        return ResponseEntity.ok(response);
    }

    /**
     * Upload a video file
     * not yet implemented!
     */
    @PostMapping(value = "/upload/video/{userId}/article/{articleId}", consumes = "multipart/form-data")
    @Operation(
            summary = "Upload video",
            description = "Uploads a video file for use in article content blocks. Supports MP4, WebM, Ogg, MOV.",
            tags = {"File Uploads"},
            operationId = "uploadVideo"
    )
    @Parameters({
            @Parameter(
                    name = "file",
                    description = "Video file (MP4, WebM, Ogg, MOV). Max size: 500MB",
                    required = true,
                    in = ParameterIn.QUERY
            ),
            @Parameter(
                    name = "title",
                    description = "Video title",
                    required = false,
                    in = ParameterIn.QUERY
            ),
            @Parameter(
                    name = "description",
                    description = "Video description",
                    required = false,
                    in = ParameterIn.QUERY
            )
    })
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Video uploaded successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = VideoUploadResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid file or parameters"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized"
            ),
            @ApiResponse(
                    responseCode = "413",
                    description = "File too large (max 500MB)"
            ),
            @ApiResponse(
                    responseCode = "415",
                    description = "Unsupported media type"
            )
    })
    public ResponseEntity<FileUploadResponse> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @PathVariable String userId,
            @PathVariable String articleId
    ) {
        FileUploadResponse response = fileUploadService.uploadArticleVideo(file,userId,articleId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a file
     */
    @DeleteMapping("/{fileId}/author/{articleId}")
    @Operation(
            summary = "Delete file",
            description = "Deletes a file from storage. Only the uploader can delete their files.",
            tags = {"File Uploads"},
            operationId = "deleteFile"
    )
    @Parameters({
            @Parameter(
                    name = "fileId",
                    description = "The ID of the file to delete",
                    required = true,
                    in = ParameterIn.PATH
            )
    })
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "File deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - not the file uploader"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "File not found"
            )
    })
    public ResponseEntity<Void> deleteFile(
            @PathVariable String fileId,
            @PathVariable String articleId
    ) {
        fileUploadService.deleteFile(fileId, articleId);
        return ResponseEntity.noContent().build();
    }
}
