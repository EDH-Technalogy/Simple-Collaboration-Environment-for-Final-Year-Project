package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.controller.FileViewController;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class FileViewService {
    private final AuthService authService;
    private final RepositoryService vicRepositoryService;
    private final MinioStorageService minioStorageService;
    private final CommitGraphService commitGraphService;

//    public FileViewController.FileContentResponse getFileContent(){}
}
