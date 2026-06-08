
package  com.final_project.versioncontrolservice.config;
import com.final_project.versioncontrolservice.service.MinioStorageService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class StorageBootstrap {

    private final MinioStorageService minioStorageService;

    public StorageBootstrap(MinioStorageService minioStorageService) {
        this.minioStorageService = minioStorageService;
    }

    @PostConstruct
    public void init() {
        minioStorageService.ensureBuckets();
    }
}
