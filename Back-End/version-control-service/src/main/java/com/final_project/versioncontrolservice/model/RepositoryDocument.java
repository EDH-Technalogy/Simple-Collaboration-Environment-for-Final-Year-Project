package com.final_project.versioncontrolservice.model;

import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.UserDTO;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "repository")
@Builder
public class RepositoryDocument {

    @Id
    private String id;

    private UserDTO owner;
    private String repositoryName;
    private String description;

    private RepositoryVisibility visibility = RepositoryVisibility.PUBLIC;
    private List<ContributorUser> collaborators = new ArrayList<>();
    private Map<String, String> branchHeads = new HashMap<>();
    private String cloneUrl;

    @CreatedDate
    private  LocalDateTime createdAt;

    @LastModifiedDate

    private LocalDateTime updatedAt;


    private String symbolicHead = "refs/heads/main";
    public static String compositeId(String owner, String name) {
        return owner.toLowerCase() + "/" + name.toLowerCase();
    }
}
