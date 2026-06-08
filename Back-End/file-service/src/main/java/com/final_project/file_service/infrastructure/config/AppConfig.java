package com.final_project.file_service.infrastructure.config;

import com.final_project.file_service.domain.ports.BucketStrategy;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import com.final_project.file_service.infrastructure.minio.MinioStorageAdapter;
import com.final_project.file_service.infrastructure.stradegy.UniversalBucketStrategy;
import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Value("${storage.url}")
    private String url;
    @Value("${storage.accessKey}")
    private String accessKey;
    @Value("${storage.secretKey}")
    private  String secretKey;

    @Bean
    public MinioClient minioClient(){
        return MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey).build();
    }

    @Bean
    public BucketStrategy bucketStrategy(){
        return new UniversalBucketStrategy();
    }

    @Bean
    public FileStoragePort fileStoragePort(MinioClient client){
        return new MinioStorageAdapter(client);
    }
    @Bean
    public FileService fileService(FileStoragePort fileStoragePort, BucketStrategy bucketStrategy, FileRecordService fileRecordService){
        return new FileService(fileStoragePort,bucketStrategy, fileRecordService);
    }

}
