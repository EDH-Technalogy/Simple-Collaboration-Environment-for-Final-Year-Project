package com.final_project.blog_service.client;

import com.final_project.blog_service.config.FileServiceFeignConfig;
import com.final_project.blog_service.dto.response.FileCdnUrlResponse;
import com.final_project.blog_service.dto.response.FileMetadataResponse;
import com.final_project.blog_service.dto.response.FileUploadResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(
        name = "file-service",
        url = "http://localhost:8084",
        configuration = FileServiceFeignConfig.class
)
public interface FileServiceClient {
    @PostMapping(value = "/file/blog/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    FileUploadResponse uploadBlogFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam("ownerId") String ownerId,
            @RequestParam("article") String article
    );

    @GetMapping("/file/blog/{fileId}/owner/{ownerId}")
    FileMetadataResponse getFileMetadata(@PathVariable("fileId") String fileId, @PathVariable String ownerId);

    @GetMapping("/file/blog/{fileId}/url")
    FileCdnUrlResponse getCdnUrl(@PathVariable("fileId") String fileId);

    @DeleteMapping("/file/blog/{fileId}/article/{articleId}")
    void deleteFile(@PathVariable("fileId") String fileId, @PathVariable String articleId);
}