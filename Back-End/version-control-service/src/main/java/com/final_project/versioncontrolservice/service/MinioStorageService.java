package com.final_project.versioncontrolservice.service;

import io.minio.*;
import io.minio.errors.ErrorResponseException;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Service
public class MinioStorageService {

    private final MinioClient minioClient;
    private final String objectsBucket;
    private final String layoutBucket;

    public MinioStorageService(
            MinioClient minioClient,
            @Value("${storage.minio.bucket-objects}") String objectsBucket,
            @Value("${storage.minio.bucket-layout}") String layoutBucket
    ) {
        this.minioClient = minioClient;
        this.objectsBucket = objectsBucket;
        this.layoutBucket = layoutBucket;
    }

    public void ensureBuckets() {
        ensureBucket(objectsBucket);
        ensureBucket(layoutBucket);
    }

    public String objectsBucket() {
        return objectsBucket;
    }

    public String layoutBucket() {
        return layoutBucket;
    }

    public String objectKey(String owner, String repo, String hash) {
        return owner + "/" + repo + "/objects/" + hash.substring(0, 2) + "/" + hash.substring(2);
    }

    private static String layoutKey(String owner, String repo, String relativePath) {
        return owner + "/" + repo + "/.vic/" + relativePath;
    }

    public void writeLayoutHead(String owner, String repo) {
        byte[] data = "ref: refs/heads/main\n".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        put(layoutBucket, layoutKey(owner, repo, "HEAD"), data, "text/plain; charset=utf-8");
    }

    public void writeLayoutBranchRef(String owner, String repo, String branch, String hash) {
        String content = (hash == null || hash.isEmpty()) ? "" : hash + "\n";
        put(layoutBucket, layoutKey(owner, repo, "refs/heads/" + branch),
                content.getBytes(java.nio.charset.StandardCharsets.UTF_8), "text/plain; charset=utf-8");
    }

    public boolean objectExists(String owner, String repo, String hash) {
        return exists(objectsBucket, objectKey(owner, repo, hash));
    }

    public byte[] getObjectBytes(String owner, String repo, String hash) {
        return get(objectsBucket, objectKey(owner, repo, hash));
    }

    public void putObjectIfAbsent(String owner, String repo, String hash, byte[] data) {
        String key = objectKey(owner, repo, hash);
        if (exists(objectsBucket, key)) {
            return;
        }
        put(objectsBucket, key, data, "application/octet-stream");
    }

    private void put(String bucket, String key, byte[] data, String contentType) {
        try {
            ensureBucket(bucket);
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(key)
                            .stream(new ByteArrayInputStream(data), data.length, -1)
                            .contentType(contentType)
                            .build()
            );
        } catch (Exception e) {
            throw new StorageException("put failed: " + key, e);
        }
    }

    private byte[] get(String bucket, String key) {
        try (InputStream in = minioClient.getObject(
                GetObjectArgs.builder().bucket(bucket).object(key).build())) {
            return in.readAllBytes();
        } catch (Exception e) {
            throw new StorageException("get failed: " + key, e);
        }
    }

    private boolean exists(String bucket, String key) {
        try {
            minioClient.statObject(StatObjectArgs.builder().bucket(bucket).object(key).build());
            return true;
        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return false;
            }
            throw new StorageException("stat failed: " + key, e);
        } catch (Exception e) {
            throw new StorageException("stat failed: " + key, e);
        }
    }

    private void ensureBucket(String bucket) {
        try {
            boolean ok = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!ok) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new StorageException("bucket: " + bucket, e);
        }
    }

    public static class StorageException extends RuntimeException {
        public StorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
