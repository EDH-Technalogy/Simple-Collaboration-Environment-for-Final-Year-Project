package com.final_project.faculty_service.utils;

import com.final_project.faculty_service.services.exception.ResourceBadRequest;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileServiceStorage {
    @Value("${file.upload}")
    private String baseURIL;
    private static final String SERVICE_FOLDER = "faculty-service";

    public String saveLogo(MultipartFile file, String university){
        try{

            Path root = Paths.get(baseURIL,SERVICE_FOLDER,"data/university/logo");
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }
            validatedLogo(file);
            String fileName = university+"_"+file.getOriginalFilename();
            Path filePath = root.resolve(fileName);


            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return filePath.toString();
        }catch (Exception e){
            throw new ResourceNotFoundException("Could not store the file");
        }
    }
    public void validatedLogo(MultipartFile file){
        if (file.isEmpty()){
            throw new ResourceBadRequest("File is Empty");
        }
        if (!file.getContentType().startsWith("image/") || file.getContentType().equals("image/jpeg") || file.getContentType().isBlank()){
            throw new ResourceBadRequest("File is not Image");
        }
        long maxSize = 2 * 1024 * 1024;
        if (file.getSize() > maxSize){
            throw new ResourceBadRequest("File is too large Less than 2MB");
        }
    }
}
