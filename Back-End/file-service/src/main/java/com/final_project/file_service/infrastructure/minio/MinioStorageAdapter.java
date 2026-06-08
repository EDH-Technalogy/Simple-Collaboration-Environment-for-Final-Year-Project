package com.final_project.file_service.infrastructure.minio;

import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.*;
import io.minio.*;
import io.minio.http.Method;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@AllArgsConstructor
public class MinioStorageAdapter implements FileStoragePort {
    private final MinioClient minioClient;
    @Override
    public void upload(String buket, String key, InputStream stream, String contentType) {
        try {
            ensureBucketExist(buket);
            minioClient.putObject(
                    PutObjectArgs
                            .builder()
                            .bucket(buket)
                            .object(key)
                            .stream(stream,-1,10485760)
                            .contentType(contentType)
                            .build()
            );
        }
        catch (Exception e) {
            throw new NotUploadException(e.getMessage());
        }
    }

    @Override
    public InputStream download(String buket, String key) {
        try{
            return minioClient.getObject(
                    GetObjectArgs
                            .builder()
                            .bucket(buket)
                            .object(key)
                            .build()
            );
        }catch (Exception e) {
            throw new NotDownloadException(e.getMessage());
        }
    }

    @Override
    public void delete(String buket, String key) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(buket)
                            .object(key)
                            .build()
            );
        }catch (Exception e) {
            throw new NotDeleteException(e.getMessage());
        }
    }


    @Override
    public String generatePresignedUrl(String buket, String key) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs
                            .builder()
                            .bucket(buket)
                            .object(key)
                            .method(Method.GET)
                            .build()
            );
        }
        catch (Exception e) {
            throw new NotGenerateURLException(e.getMessage());
        }
    }

    private boolean ensureBucketExist(String bucket)  {
        try {
            boolean found = minioClient.bucketExists(
                    BucketExistsArgs
                            .builder()
                            .bucket(bucket)
                            .build()
            );
            if(!found){
                minioClient.makeBucket(
                        MakeBucketArgs
                                .builder()
                                .bucket(bucket)
                                .build()
                );
            }
            return true;
        }catch (Exception e) {
            throw new BucketCreationFail(e.getMessage());
        }
    }
}
